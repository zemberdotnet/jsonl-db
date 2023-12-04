import type { Event } from "benchmark";

export function writeEvent(stream: any, event: Event) {
  if (process.env.GIT_COMMIT) {
    stream.write(
      JSON.stringify({ commit: process.env.GIT_COMMIT, hz: event.target.hz }) +
      "\n",
    );
  } else {
    stream.write(
      JSON.stringify({ target: event.target.name, hz: event.target.hz }) + "\n",
    );
  }
}
