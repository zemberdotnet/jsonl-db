import path from "path";
import { JsonLinesDataBase } from "../src";
import { BENCHMARK_DATA_DIR } from "./constants";
import { randomUUID as uuid } from "crypto";
import { benchmarkPersisterSuite } from "./util";

const suite = benchmarkPersisterSuite();

const getSize = [1, 10_000, 100_0000];

function times<T>(n: number, fn: (n: number) => T): T[] {
  let t: T[] = [];
  for (let i = 0; i < n; i++) {
    t.push(fn(i));
  }
  return t;
}

// The results of these should be nearly constant for any file size
async function main() {
  for (const size of getSize) {
    const fp = path.join(BENCHMARK_DATA_DIR, uuid());
    const db = JsonLinesDataBase(fp, "id");
    const payloads = times(size, (n) => ({ _key: `crow:${n}`, _type: "crow" }));
    const randomGet = `crow:${Math.floor(size * Math.random())}`;
    for (const payload of payloads) {
      await db.write(payload);
    }
    suite.add(`db.get.${size}`, async () => {
      await db.get(randomGet);
    });
  }

  suite.run({ async: true });
}

main().catch(console.error);
