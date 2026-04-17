export type RateLimitCode = "rpm" | "tpm";

export type RateLimitConfig = {
  disabled: boolean;
  windowMs: number;
  rpm: number;
  tpm: number;
  defaultMaxOutputTokens: number;
  /** Extra tokens charged per UI message (formatting overhead). */
  perMessageOverhead: number;
};

export type RateLimitOk = {
  ok: true;
  limitRpm: number;
  limitTpm: number;
  remainingRpm: number;
  remainingTpm: number;
};

export type RateLimitDenied = {
  ok: false;
  code: RateLimitCode;
  retryAfterSeconds: number;
};

export type RateLimitResult = RateLimitOk | RateLimitDenied;

export function isRateLimitDenied(r: RateLimitResult): r is RateLimitDenied {
  return !r.ok;
}
