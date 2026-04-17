import type { UIMessage } from "ai";
import { loadRateLimitConfigFromEnv } from "./env-config";
import { estimateChatRequestTokens } from "./estimate-request-tokens";
import { MemoryRateLimitStore } from "./memory-store";
import { resolveClientIpFromRequest } from "./resolve-client-ip";
import { isRateLimitDenied, type RateLimitResult } from "./types";
import { UpstashRateLimitStore } from "./upstash-store";

export type ChatRateLimitBody = {
  messages: UIMessage[];
  system?: string;
  maxTokens?: number;
};

export type RateLimitApplyResult =
  | { allowed: true; headers: Record<string, string> }
  | { allowed: false; response: Response };

let memorySingleton: MemoryRateLimitStore | null = null;
let upstashSingleton: UpstashRateLimitStore | null = null;

function getMemoryStore() {
  memorySingleton ??= new MemoryRateLimitStore();
  return memorySingleton;
}

function getUpstashStore() {
  upstashSingleton ??= new UpstashRateLimitStore();
  return upstashSingleton;
}

function hasUpstashEnv(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return Boolean(url && token);
}

/**
 * Returns whether the request may proceed. When allowed, includes optional rate-limit headers
 * for the upstream response. When denied, returns a ready-to-return 429 Response.
 */
export async function enforceChatRateLimit(
  req: Request,
  body: ChatRateLimitBody,
): Promise<RateLimitApplyResult> {
  const config = loadRateLimitConfigFromEnv();
  if (config.disabled) {
    return { allowed: true, headers: {} };
  }

  const tokenEstimate = estimateChatRequestTokens(body, {
    defaultMaxOutputTokens: config.defaultMaxOutputTokens,
    perMessageOverhead: config.perMessageOverhead,
  });

  const ip = resolveClientIpFromRequest(req);
  const store = hasUpstashEnv() ? getUpstashStore() : getMemoryStore();

  const result: RateLimitResult = await store.checkAndConsume(ip, tokenEstimate, config);

  if (isRateLimitDenied(result)) {
    const retry = result.retryAfterSeconds;
    return {
      allowed: false,
      response: Response.json(
        {
          error: "Rate limit exceeded",
          code: result.code,
          retryAfterSeconds: retry,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retry),
            "Cache-Control": "no-store",
          },
        },
      ),
    };
  }

  return {
    allowed: true,
    headers: {
      "X-RateLimit-Limit-Rpm": String(result.limitRpm),
      "X-RateLimit-Remaining-Rpm": String(result.remainingRpm),
      "X-RateLimit-Limit-Tpm": String(result.limitTpm),
      "X-RateLimit-Remaining-Tpm": String(result.remainingTpm),
      "Cache-Control": "no-store",
    },
  };
}
