import { Suite } from "benchmark";
//import { Event } from "benchmark";
import path from "path";
import { JsonLinesDataBase } from "../src";
import { BENCHMARK_DATA_DIR, cleanBenchmarkDir } from "./constants";
import { randomUUID as uuid } from "crypto";
import { writeEvent } from "./util";

const suite = new Suite();

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

suite
  .on("cycle", function(event: any) {
    writeEvent(process.stdout, event);
  })
  .on("complete", function() {
    // @ts-ignore
    console.log("Fastest is " + (this as any).filter("fastest").map("name"));
    cleanBenchmarkDir();
  })
  // run async
  .run({ async: true });
