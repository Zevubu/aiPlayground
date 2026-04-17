import { describe, expect, it, vi } from "vitest";

/**
 * Example patterns: timers and mocks. Rename to strings.test.ts if you promote
 * these into real tests; keep *.example.test.ts as copy-paste only if you prefer.
 */
describe("example patterns", () => {
  it("uses fake timers", () => {
    vi.useFakeTimers();
    let n = 0;
    const id = setInterval(() => {
      n += 1;
    }, 1000);
    vi.advanceTimersByTime(2500);
    expect(n).toBe(2);
    clearInterval(id);
    vi.useRealTimers();
  });

  it("mocks a function", () => {
    const fn = vi.fn((x: number) => x * 2);
    expect(fn(3)).toBe(6);
    expect(fn).toHaveBeenCalledWith(3);
  });
});
