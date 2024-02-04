// This file does some TypeScript magic to make the standalone `expect` package have types
// compatible with the extended matchers
import { match } from "assert";
import expect from "expect";
import * as matchers from "jest-extended";


type CustomMatcher = {
  toBeOrNotToBe: () => void;
};

type match = typeof matchers & CustomMatcher;

declare module "expect" {
  interface Matchers<R> extends match { }
}

expect.extend(matchers);
expect.extend({
  toBeOrNotToBe(this: any, actual: any, ...expected: Array<any>) {
    return {
      pass: true,
      message() {
        return "all clear!";
      },
    };
  },
});

expect([]).toBeArray();
expect([]).toIncludeAllMembers([]);
expect([]).toBeOrNotToBe();

export { expect };
