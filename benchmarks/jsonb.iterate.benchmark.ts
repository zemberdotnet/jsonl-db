import path from "path";
import { JsonLinesDataBase } from "../src";
import { BENCHMARK_DATA_DIR } from "./constants";
import { randomUUID as uuid } from "crypto";
import { benchmarkPersisterSuite, writeEvent } from "./util";

const suite = benchmarkPersisterSuite();

const getSize = [100];

function times<T>(n: number, fn: (n: number) => T): T[] {
  let t: T[] = [];
  for (let i = 0; i < n; i++) {
    t.push(fn(i));
  }
  return t;
}

async function main() {
  for (const size of getSize) {
    const fp = path.join(BENCHMARK_DATA_DIR, uuid());
    const db = JsonLinesDataBase(fp, "id");
    const payloads = times(size, (n) => ({ _key: `crow:${n}`, _type: "crow" }));
    for (const payload of payloads) {
      await db.write(payload);
    }

    
    suite.add(`db.iterate.${size}`, async () => {
      await db.iterate(() => { });
    });
  }

  suite.run({ async: true });
}

main().catch(console.error);
