import type { RateLimitConfig } from "./types";

function parseIntEnv(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseBoolEnv(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true" || value === "1";
}

export function loadRateLimitConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): RateLimitConfig {
  return {
    disabled: parseBoolEnv(env.RATE_LIMIT_DISABLED),
    windowMs: parseIntEnv(env.RATE_LIMIT_WINDOW_MS, 60_000),
    rpm: parseIntEnv(env.RATE_LIMIT_RPM, 20),
    tpm: parseIntEnv(env.RATE_LIMIT_TPM, 80_000),
    defaultMaxOutputTokens: parseIntEnv(env.RATE_LIMIT_DEFAULT_MAX_OUTPUT, 4096),
    perMessageOverhead: parseIntEnv(env.RATE_LIMIT_PER_MESSAGE_OVERHEAD, 50),
  };
}
