import { describe, expect, it } from "vitest";
import { resolveClientIpFromRequest } from "@/lib/rate-limit/resolve-client-ip";

describe("resolveClientIpFromRequest", () => {
  it("uses the first X-Forwarded-For hop", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });
    expect(resolveClientIpFromRequest(req)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    expect(resolveClientIpFromRequest(req)).toBe("198.51.100.2");
  });

  it("returns unknown when no proxy headers", () => {
    const req = new Request("http://localhost");
    expect(resolveClientIpFromRequest(req)).toBe("unknown");
  });
});
