import { JSONLinesDatabase } from "./jsonlinesdb";
import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import { describe, test, beforeEach, after, mock } from "node:test";
import { randomUUID as uuid } from "crypto";
import expect from "expect";

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

    test("should add data and return byte length", async () => {
      const obj = { id: uuid(), name: "Test" };
      const byteLength = await db.write(obj.id, obj);

      expect(byteLength).toBe(60);
    });

    test("should write multiple times and return correct byte length each time", async () => {
      const obj1 = { id: uuid(), name: "Test" };
      const obj2 = { id: uuid(), name: "Test" };
      const b1 = await db.write(obj1.id, obj1);
      const b2 = await db.write(obj2.id, obj2);
      expect(b1).toBe(60);
      expect(b2).toBe(60);
    });

    test("should handle large objects", async () => {
      const obj = { id: uuid() };
      for (let i = 0; i < 10_000; i++) {
        Object.assign(obj, { [`${i}`]: uuid() });
      }
      await db.write(obj.id, obj);
    });
  });

  describe("get", () => {
    test("get should retrieve the correct data", async () => {
      const obj = { id: uuid(), name: "Test2" };
      await db.write(obj.id, obj);
      const retrievedObj = await db.get(obj.id);
      expect(retrievedObj).toStrictEqual(obj);
    });

    test("get should return undefined for non-existent data", async () => {
      const retrievedObj = await db.get("not-real-key");
      expect(retrievedObj).toBe(undefined);
    });
  });

  describe("iterate", () => {
    test("iterate should process all items in the database", async () => {
      await db.write(4, { id: 4, name: "Test4" });
      await db.write(5, { id: 5, name: "Test5" });

      const processedIds: number[] = [];
      await db.iterate((obj) => {
        processedIds.push(obj.id);
      });

      expect(processedIds).toStrictEqual([4, 5]);
    });
  });

  describe("async iterator", () => {
    test("should process all items in the database", async () => {
      const ids = [uuid(), uuid(), uuid()];
      await Promise.all(ids.map((e) => db.write(e, { id: e })));
      const processedIds: number[] = [];
      for await (const obj of db) {
        processedIds.push(obj.id);
      }
      expect(processedIds).toStrictEqual(ids);
    });
  });
});
