import type { RateLimitConfig, RateLimitOk, RateLimitResult } from "./types";

type Event = { t: number; tokens: number };

function oldestTimestamp(events: Event[]): number | null {
  if (events.length === 0) return null;
  let min = events[0].t;
  for (let i = 1; i < events.length; i++) {
    if (events[i].t < min) min = events[i].t;
  }
  return min;
}

function retryAfterSecondsFromOldest(
  now: number,
  oldest: number,
  windowMs: number,
): number {
  const msUntilSlot = oldest + windowMs - now;
  return Math.max(1, Math.ceil(msUntilSlot / 1000));
}

export class MemoryRateLimitStore {
  private readonly buckets = new Map<string, Event[]>();
  /** Promise chain tail per IP so check+consume runs strictly serialized. */
  private readonly tail = new Map<string, Promise<void>>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  /**
   * Serialize check+mutate per IP to avoid burst races on the same key.
   */
  async checkAndConsume(
    ip: string,
    tokenEstimate: number,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const prevDone = this.tail.get(ip) ?? Promise.resolve();
    let resolveThis!: () => void;
    const thisDone = new Promise<void>((r) => {
      resolveThis = r;
    });
    this.tail.set(ip, prevDone.then(() => thisDone));
    await prevDone;
    try {
      return this.applyLocked(ip, tokenEstimate, config);
    } finally {
      resolveThis();
    }
  }

  private applyLocked(
    ip: string,
    tokenEstimate: number,
    config: RateLimitConfig,
  ): RateLimitResult {
    const now = this.now();
    const windowStart = now - config.windowMs;
    const { rpm, tpm, windowMs } = config;

    let events = this.buckets.get(ip);
    if (!events) {
      events = [];
      this.buckets.set(ip, events);
    }

    events = events.filter((e) => e.t > windowStart);
    this.buckets.set(ip, events);

    const usedRpm = events.length;
    const usedTpm = events.reduce((s, e) => s + e.tokens, 0);

    if (usedRpm >= rpm) {
      const oldest = oldestTimestamp(events);
      return {
        ok: false,
        code: "rpm",
        retryAfterSeconds:
          oldest != null ? retryAfterSecondsFromOldest(now, oldest, windowMs) : Math.ceil(windowMs / 1000),
      };
    }

    if (usedTpm + tokenEstimate > tpm) {
      const oldest = oldestTimestamp(events);
      return {
        ok: false,
        code: "tpm",
        retryAfterSeconds:
          oldest != null ? retryAfterSecondsFromOldest(now, oldest, windowMs) : Math.ceil(windowMs / 1000),
      };
    }

    events.push({ t: now, tokens: tokenEstimate });

    const nextUsedRpm = usedRpm + 1;
    const nextUsedTpm = usedTpm + tokenEstimate;

    const ok: RateLimitOk = {
      ok: true,
      limitRpm: rpm,
      limitTpm: tpm,
      remainingRpm: Math.max(0, rpm - nextUsedRpm),
      remainingTpm: Math.max(0, tpm - nextUsedTpm),
    };
    return ok;
  }
}
