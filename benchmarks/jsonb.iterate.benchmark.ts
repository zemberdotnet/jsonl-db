import { Suite } from "benchmark";
import path from "path";
import { JsonLinesDataBase } from "../src";
import { BENCHMARK_DATA_DIR, cleanBenchmarkDir } from "./constants";
import { randomUUID as uuid } from "crypto";
import { writeEvent } from "./util";

const suite = new Suite();

const getSize = [100];

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
    for (const payload of payloads) {
      await db.write(payload);
    }
    suite.add(`db.get.${size}`, async () => {
      await db.iterate(() => {});
    });
  }

  suite
    .on("cycle", function(event: any) {
      writeEvent(process.stdout, event);
    })
    .on("complete", function() {
      // @ts-ignore
      console.log("Fastest is " + (this as any).filter("fastest").map("name"));
      cleanBenchmarkDir();
    })
    .run({ async: true });
}

main().catch(console.error);
