import path from "path";
import { JsonLinesDataBase } from "../src";
import { BENCHMARK_DATA_DIR } from "./constants";
import { randomUUID as uuid } from "crypto";
import { benchmarkPersisterSuite } from "./util";

const suite = benchmarkPersisterSuite();

const writeSize = [1, 10_000, 100_000, 1_000_000];

function times<T>(n: number, fn: (n: number) => T): T[] {
  let t: T[] = [];
  for (let i = 0; i < n; i++) {
    t.push(fn(i));
  }
  return t;
}

for (const size of writeSize) {
  const fp = path.join(BENCHMARK_DATA_DIR, uuid());
  const db = JsonLinesDataBase(fp, "id");
  const payloads = times(size, (n) => ({ _key: `crow:${n}`, _type: "crow" }));

  suite.add(`db.write.${size}`, async () => {
    await db.write(payloads);
  });
}

suite.run({ async: true });
