/**
 * Tiny module used by tests/examples/tdd-counter/counter.test.ts
 * to demonstrate red-green-refactor. Extend behavior only when tests demand it.
 */

export function createCounter(initial = 0) {
  let value = initial;
  return {
    get value() {
      return value;
    },
    increment(n = 1) {
      value += n;
    },
    reset() {
      value = initial;
    },
  };
}
