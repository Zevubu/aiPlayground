import { describe, expect, it } from "vitest";

/**
 * Minimal Vitest examples — copy patterns into real tests under tests/unit/.
 */
describe("example unit suite", () => {
  it("asserts equality", () => {
    expect(1 + 1).toBe(2);
  });

  it("matches object shape", () => {
    expect({ ok: true, n: 3 }).toEqual({ ok: true, n: 3 });
  });

  it("throws", () => {
    expect(() => {
      throw new Error("boom");
    }).toThrow("boom");
  });
});
