import { JsonLinesDataBase } from "./jsonlinesdb";
import { PartitionedDatabase } from "./partitioneddatabase";

function times<T>(n: number, fn: (n: number) => T): T[] {
  let t: T[] = [];
  for (let i = 0; i < n; i++) {
    t.push(fn(i));
  }
  return t;
}

/*
 */

async function main() {
  //await rm("data1");
  const pdb = PartitionedDatabase("_type");

  pdb.add("crow", "_key");
  pdb.add("cow", "_key");

  await Promise.all(
    times(100_000, (n) => pdb.write({ _key: `crow:${n}`, _type: "crow" })),
  );

  await Promise.all(
    times(100_000, (n) => pdb.write({ _key: `cow:${n}`, _type: "cow" })),
  );

  // get a crow
  console.time("getcrow");
  const crow = await pdb.get("crow:30000");
  console.timeEnd("getcrow");

  // get a cow
  console.time("getcow");
  const cow = await pdb.get("cow:30000");
  for (let i = 0; i < 100_000; i++) {
    await pdb.get(`cow:${i}`);
  }

  console.timeEnd("getcow");

  const db = JsonLinesDataBase("data1", "_key");
  console.time('add')
  await Promise.all(times(100_000, (n) => db.write({ _key: `${n}` })));
  console.timeEnd('add');
  await db.write({ _key: "two" });
  console.time("get-default");
  const def = await db.get("two");
  console.timeEnd("get-default");
  console.log({ cow, crow, def });
}

main().catch(console.error);
