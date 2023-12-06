import { Event, Suite } from "benchmark";
import { readFileSync, writeFileSync } from "node:fs";

interface BenchmarkResult {
  target: string;
  commit: string;
  hz: number;
}

type PersisterBenchmarks = Record<string, [BenchmarkResult] | undefined>;

function readExistingBenchmarks(): PersisterBenchmarks {
  const raw = readFileSync("benchmarks/results/benchmark-results.json", "utf8");
  return JSON.parse(raw);
}

function writeExistingBenchmarks(benchmarks: PersisterBenchmarks) {
  writeFileSync(
    "benchmarks/results/benchmark-results.json",
    JSON.stringify(benchmarks, null, 2),
  );
}

function addBenchmarks(
  existing: PersisterBenchmarks,
  benchmark: BenchmarkResult,
) {
  const current = existing[benchmark.target];
  if (current) {
  } else {
    existing[benchmark.target] = [benchmark];
  }
}

function createBenchmarkResults(event: Event) {
  if (!event.target.name || event.target.hz === undefined) {
    throw new Error("missing name or hz property");
  }

  return {
    target: event.target.name,
    commit: process.env.GIT_COMMIT ?? "no-commit",
    hz: event.target.hz,
  };
}

function writeEvent(stream: any, event: Event) {
  if (process.env.GIT_COMMIT) {
    stream.write(
      JSON.stringify({
        target: event.target.name,
        commit: process.env.GIT_COMMIT,
        hz: event.target.hz,
      }) + "\n",
    );
  } else {
    stream.write(
      JSON.stringify({ target: event.target.name, hz: event.target.hz }) + "\n",
    );
  }
}

function benchmarkPersisterSuite() {
  const current = readExistingBenchmarks();
  const suite = new Suite();
  if (!process.env.GIT_COMMIT) {
    return suite.on("cycle", (event: Event) =>
      writeEvent(process.stdout, event),
    );
  }

  return suite
    .on("cycle", (event: Event) => {
      addBenchmarks(current, createBenchmarkResults(event));
    })
    .on("complete", () => writeExistingBenchmarks(current));
}

export { writeEvent, benchmarkPersisterSuite };
