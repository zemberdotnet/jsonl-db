import path from "path";
import { JSONLinesDatabase } from "../src";
import { BENCHMARK_DATA_DIR } from "./constants";
import { randomUUID as uuid } from "crypto";
import { benchmarkPersisterSuite } from "./util";

const suite = benchmarkPersisterSuite();

const writeSize = [1, 10, 100, 1_000];

function times<T>(n: number, fn: (n: number) => T): T[] {
  let t: T[] = [];
  for (let i = 0; i < n; i++) {
    t.push(fn(i));
  }
  return t;
}

for (const size of writeSize) {
  const fp = path.join(BENCHMARK_DATA_DIR, uuid());
  const db = JSONLinesDatabase(fp);
  const payloads = times(size, (n) => ({ _key: `crow:${n}`, _type: "crow" }));

  suite.add(`db.write.${size}`, async () => {
    for (const p of payloads) {
      await db.write(p._key, p);
    }
  });
}

suite.run({ async: true });
