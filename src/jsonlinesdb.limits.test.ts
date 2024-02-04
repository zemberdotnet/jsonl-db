import { JSONLinesDatabase } from "./jsonlinesdb";
import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import { describe, test, beforeEach, after, mock } from "node:test";
import { randomUUID as uuid } from "crypto";

import fs from "fs";
describe("JsonLinesDataBase", () => {
  const filePath = `testdata/${uuid()}`;
  let db: JSONLinesDatabase;

  beforeEach(() => {
    db = JSONLinesDatabase(filePath);
    mock.restoreAll();
  });

  after(async () => {
    try {
      await rm(dirname(filePath), { recursive: true });
    } catch (err) {
      console.error(err);
    }
  });

  describe("write", () => {
    mock.method(fs, "createWriteStream", () => {
      return {
        write(_: any, cb: (u: undefined) => undefined) {
          cb(undefined);
          return true;
        },
      };
    });

    // Usually the maximum number of keys in a Map
    // is 2^24. 17_000_000 is above that so it ensure
    // that isn't a limit our database has
    test("can write 17_000_000 objects", async () => {
      const obj = new Uint8Array();
      const LIMIT = 1;
      for (let i = 0; i < LIMIT; i++) {
        await db.write(uuid(), obj);
      }
    });
  });

  describe("get", () => {
    mock.method(fs, "createWriteStream", () => {
      return {
        write(_: any, cb: (u: undefined) => undefined) {
          cb(undefined);
          return true;
        },
      };
    });

    test("can read large value", async () => {
      mock.method(fs, "createReadStream", () => {
        return {
          async *[Symbol.asyncIterator]() {
            const obj = { id: uuid() };
            for (let i = 0; i < 10_000; i++) {
              Object.assign(obj, { [`${i}`]: uuid() });
            }
            const str = JSON.stringify(obj);
            const firstStr = str.slice(0, str.length/2);
            const secondStr = str.slice(str.length/2);
            yield Buffer.from(firstStr);
            yield Buffer.from(secondStr);
          }
        };
      });

      await db.write("thing", {});
      await db.get("thing");
    });
  });
});
