import { rmSync } from "fs";

export const BENCHMARK_DATA_DIR = "benchmarkdata";

export function cleanBenchmarkDir() {
  rmSync(BENCHMARK_DATA_DIR, { recursive: true });
}
