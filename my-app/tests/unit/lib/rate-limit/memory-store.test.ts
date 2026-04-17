import { describe, expect, it } from "vitest";
import { MemoryRateLimitStore } from "@/lib/rate-limit/memory-store";
import type { RateLimitConfig } from "@/lib/rate-limit/types";
import { isRateLimitDenied } from "@/lib/rate-limit/types";

function cfg(over: Partial<RateLimitConfig> = {}): RateLimitConfig {
  return {
    disabled: false,
    windowMs: 60_000,
    rpm: 2,
    tpm: 10_000,
    defaultMaxOutputTokens: 4096,
    perMessageOverhead: 50,
    ...over,
  };
}

describe("MemoryRateLimitStore", () => {
  it("denies RPM when the window already has rpm requests", async () => {
    const now = 1_000_000;
    const store = new MemoryRateLimitStore(() => now);
    const c = cfg({ rpm: 2 });

    const a1 = await store.checkAndConsume("ip-a", 100, c);
    expect(a1.ok).toBe(true);

    const a2 = await store.checkAndConsume("ip-a", 100, c);
    expect(a2.ok).toBe(true);

    const a3 = await store.checkAndConsume("ip-a", 100, c);
    expect(isRateLimitDenied(a3)).toBe(true);
    if (isRateLimitDenied(a3)) {
      expect(a3.code).toBe("rpm");
      expect(a3.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("denies TPM when estimated tokens would exceed the budget", async () => {
    const now = 2_000_000;
    const store = new MemoryRateLimitStore(() => now);
    const c = cfg({ rpm: 100, tpm: 250 });

    const r1 = await store.checkAndConsume("ip-b", 200, c);
    expect(r1.ok).toBe(true);

    const r2 = await store.checkAndConsume("ip-b", 100, c);
    expect(isRateLimitDenied(r2)).toBe(true);
    if (isRateLimitDenied(r2)) {
      expect(r2.code).toBe("tpm");
    }
  });

  it("prunes old events after the window advances", async () => {
    let now = 0;
    const store = new MemoryRateLimitStore(() => now);
    const c = cfg({ rpm: 1, windowMs: 1000 });

    const d1 = await store.checkAndConsume("ip-c", 1, c);
    expect(d1.ok).toBe(true);

    now = 500;
    const d2 = await store.checkAndConsume("ip-c", 1, c);
    expect(isRateLimitDenied(d2)).toBe(true);

    now = 1001;
    const d3 = await store.checkAndConsume("ip-c", 1, c);
    expect(d3.ok).toBe(true);
  });

  it("tracks different IPs independently", async () => {
    const store = new MemoryRateLimitStore(() => 5_000_000);
    const c = cfg({ rpm: 1 });

    expect((await store.checkAndConsume("ip-1", 1, c)).ok).toBe(true);
    expect(isRateLimitDenied(await store.checkAndConsume("ip-1", 1, c))).toBe(true);
    expect((await store.checkAndConsume("ip-2", 1, c)).ok).toBe(true);
  });
});
