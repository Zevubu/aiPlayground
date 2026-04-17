import { describe, expect, it } from "vitest";
import { createCounter } from "./counter";

/**
 * TDD-style example: specs describe behavior; implementation stays minimal.
 */
describe("createCounter", () => {
  it("starts at the given initial value", () => {
    const c = createCounter(3);
    expect(c.value).toBe(3);
  });

  it("increments by 1 by default", () => {
    const c = createCounter(0);
    c.increment();
    expect(c.value).toBe(1);
  });

  it("increments by a custom step", () => {
    const c = createCounter(10);
    c.increment(5);
    expect(c.value).toBe(15);
  });

  it("resets to the initial seed", () => {
    const c = createCounter(2);
    c.increment();
    c.reset();
    expect(c.value).toBe(2);
  });
});
