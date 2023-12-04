import { createInterface } from "node:readline/promises";
import { createReadStream, createWriteStream } from "fs";
import { dirname } from "path";
import { mkdirSync } from "fs";

interface JSONLinesDataBase {
  iterate: (
    cb: (obj: Record<string, any>) => Promise<void> | void,
  ) => Promise<void>;
  write: (object: Record<string, any>) => Promise<number>;
  get: (key: string) => Promise<any>;
  keyName: () => string;
}

/**
 * `JsonLinesDataBase` is a file-based database for storing JSON objects.
 *
 * Every object stored must have a unique key. The name of the key is given by
 *
 */
function JsonLinesDataBase(fp: string, objectKeyName: string) {
  let start = 0;

  // replace with elegant pair?
  // could also replace key with any to be more permissive with keys
  const objectKeyToLocation = new Map<string, [number, number]>();

  // ensure the directory exists
  mkdirSync(dirname(fp), { recursive: true });
  const stream = createWriteStream(fp);
  async function write(object: Record<string, any>): Promise<number> {
    return new Promise((resolve, reject) => {
      const bufferedObj = objectToJsonLines(object);
      stream.write(bufferedObj, (err) => {
        if (!err) {
          // reusing keys is undefined behavior
          const key = object[objectKeyName];
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
    // TODO consume enough to actually always work
    for await (const chunk of stream) {
      return JSON.parse(chunk.toString());
    }
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

  function keyName() {
    return objectKeyName;
  }

  return {
    iterate,
    write,
    get,
    keyName,
    async *[Symbol.asyncIterator]() {
      const stream = createReadStream(fp);
      const rl = createInterface(stream);
      for await (const line of rl) {
        yield JSON.parse(line);
      }
    },
  } as JSONLinesDataBase;
}

function objectToJsonLines(o: Object): Buffer {
  return Buffer.from(JSON.stringify(o) + "\n");
}

export { JsonLinesDataBase, JSONLinesDataBase };
