import { createInterface } from "node:readline/promises";
import { createReadStream, createWriteStream } from "fs";
import { dirname } from "path";
import { mkdirSync } from "fs";

interface JSONLinesDatabase {
  iterate: (
    cb: (obj: Record<string, any>) => Promise<void> | void,
  ) => Promise<void>;
  write: (key: any, object: Record<string, any>) => Promise<number>;
  get: (key: string) => Promise<any>;
  has: (key: string) => boolean;
  [Symbol.asyncIterator](): AsyncIterator<any>;
}

/**
 * `JSONLinesDatabase` is a file-based database for storing JSON objects.
 *
 * Every object stored must have a unique key. The name of the key is given by
 *
 */
function JSONLinesDatabase(fp: string) {
  let start = 0;

  // replace with elegant pair?
  const objectKeyToLocation = new Map<any, [number, number]>();

  // ensure the directory exists
  mkdirSync(dirname(fp), { recursive: true });
  const stream = createWriteStream(fp);

  async function write(
    key: unknown,
    object: Record<string, any>,
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const bufferedObj = objectToJsonLines(object);
      stream.write(bufferedObj, (err) => {
        if (!err) {
          // reusing keys is undefined behavior
          objectKeyToLocation.set(key, [
            start,
            start + bufferedObj.byteLength - 1,
          ]);
          start += bufferedObj.byteLength;

          resolve(bufferedObj.byteLength);
        } else {
          reject(err);
        }
      });
    });
  }

  async function get(key: string): Promise<any> {
    const loc = objectKeyToLocation.get(key);
    if (!loc) {
      return undefined;
    }

    const stream = createReadStream(fp, { start: loc[0], end: loc[1] });
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString());
  }

  function has(key: string): boolean {
    return objectKeyToLocation.has(key);
  }

  async function iterate(
    cb: (obj: Object) => Promise<void> | void,
  ): Promise<void> {
    const stream = createReadStream(fp);
    const rl = createInterface(stream);
    for await (const line of rl) {
      const obj = JSON.parse(line);
      await cb(obj);
    }
  }

  return {
    iterate,
    write,
    has,
    get,
    async *[Symbol.asyncIterator]() {
      const stream = createReadStream(fp);
      const rl = createInterface(stream);
      for await (const line of rl) {
        yield JSON.parse(line);
      }
    },
  } as JSONLinesDatabase;
}

function objectToJsonLines(o: Object): Buffer {
  return Buffer.from(JSON.stringify(o) + "\n");
}

export { JSONLinesDatabase };
