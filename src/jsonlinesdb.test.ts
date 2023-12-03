import { JSONLinesDataBase, JsonLinesDataBase } from "./jsonlinesdb";
import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import { describe, test, beforeEach, after } from "node:test";
import { randomUUID as uuid } from "crypto";
import assert from "node:assert";

describe("JsonLinesDataBase", () => {
  const filePath = `testdata/${uuid()}`;
  const keyName = "id";
  let db: JSONLinesDataBase;

  beforeEach(() => {
    db = JsonLinesDataBase(filePath, keyName);
  });

  after(async () => {
    try {
      await rm(dirname(filePath), { recursive: true });
    } catch (err) {
      console.error(err);
    }
  });

  describe("write", () => {
    test("should add data and return byte length", async () => {
      const obj = { id: uuid(), name: "Test" };
      const byteLength = await db.write(obj);

      assert.strictEqual(byteLength, 60);
    });

    test("should write multiple times and return correct byte length each time", async () => {
      const obj1 = { id: uuid(), name: "Test" };
      const obj2 = { id: uuid(), name: "Test" };
      const b1 = await db.write(obj1);
      const b2 = await db.write(obj2);
      assert.strictEqual(b1, 60);
      assert.strictEqual(b2, 60);
    });

    test("should handle large objects", async () => {
      const obj = { id: uuid() };
      for (let i = 0; i < 10_000; i++) {
        Object.assign(obj, { [`${i}`]: uuid() });
      }
      await db.write(obj);
    });
  });

  describe("get", () => {
    test("get should retrieve the correct data", async () => {
      const obj = { id: uuid(), name: "Test2" };
      await db.write(obj);
      const retrievedObj = await db.get(obj.id);
      assert.deepStrictEqual(retrievedObj, obj);
    });

    test("get should return undefined for non-existent data", async () => {
      const retrievedObj = await db.get("not-real-key");
      assert.strictEqual(retrievedObj, undefined);
    });
  });

  describe("iterate", () => {
    test("iterate should process all items in the database", async () => {
      await db.write({ id: 4, name: "Test4" });
      await db.write({ id: 5, name: "Test5" });

      const processedIds: number[] = [];
      await db.iterate((obj) => {
        processedIds.push(obj.id);
      });

      assert.deepStrictEqual(processedIds, [4, 5]);
    });
  });

  test("keyName should return the correct key name", () => {
    assert.strictEqual(db.keyName(), keyName);
  });
});
