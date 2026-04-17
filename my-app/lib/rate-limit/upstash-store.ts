import { Redis } from "@upstash/redis";
import type { RateLimitConfig, RateLimitResult } from "./types";

const LUA = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local rpmLimit = tonumber(ARGV[3])
local tpmLimit = tonumber(ARGV[4])
local newTok = tonumber(ARGV[5])
local member = ARGV[6]
local minScore = now - window

redis.call('ZREMRANGEBYSCORE', key, '-inf', minScore)

local entries = redis.call('ZRANGE', key, 0, -1)
local count = #entries
local sumTok = 0
for i = 1, count do
  local memb = entries[i]
  local p = string.find(memb, '|', 1, true)
  if p then
    local n = tonumber(string.sub(memb, 1, p - 1))
    if n then sumTok = sumTok + n end
  end
end

local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local function retrySec()
  if oldest == nil or #oldest < 2 then
    return math.ceil(window / 1000)
  end
  local oldestScore = tonumber(oldest[2])
  if oldestScore == nil then return math.ceil(window / 1000) end
  local ms = window - (now - oldestScore)
  if ms < 1000 then return 1 end
  return math.ceil(ms / 1000)
end

if count >= rpmLimit then
  return {'DENY', 'rpm', tostring(retrySec())}
end

if sumTok + newTok > tpmLimit then
  return {'DENY', 'tpm', tostring(retrySec())}
end

redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, window + 60000)

local newCount = count + 1
local newSum = sumTok + newTok
return {
  'OK',
  tostring(rpmLimit - newCount),
  tostring(tpmLimit - newSum),
  tostring(rpmLimit),
  tostring(tpmLimit)
}
`;

export class UpstashRateLimitStore {
  private readonly redis: Redis;
  private readonly script: {
    eval: (keys: string[], args: string[]) => Promise<unknown>;
  };

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    this.script = this.redis.createScript<string[]>(LUA);
  }

  async checkAndConsume(
    ip: string,
    tokenEstimate: number,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const member = `${tokenEstimate}|${now}-${Math.random().toString(36).slice(2)}`;
    const key = `rl:chat:${ip}`;

    const raw = await this.script.eval([key], [
      String(config.windowMs),
      String(now),
      String(config.rpm),
      String(config.tpm),
      String(tokenEstimate),
      member,
    ]);

    const arr = normalizeEvalResult(raw);
    if (!arr || arr.length < 1) {
      return {
        ok: false,
        code: "rpm",
        retryAfterSeconds: Math.ceil(config.windowMs / 1000),
      };
    }

    if (arr[0] === "DENY") {
      const code = arr[1] === "tpm" ? "tpm" : "rpm";
      const retry = Number.parseInt(arr[2] ?? "60", 10);
      return {
        ok: false,
        code,
        retryAfterSeconds: Number.isFinite(retry) ? retry : 60,
      };
    }

    if (arr[0] === "OK" && arr.length >= 5) {
      return {
        ok: true,
        remainingRpm: Number.parseInt(arr[1]!, 10),
        remainingTpm: Number.parseInt(arr[2]!, 10),
        limitRpm: Number.parseInt(arr[3]!, 10),
        limitTpm: Number.parseInt(arr[4]!, 10),
      };
    }

    return {
      ok: false,
      code: "rpm",
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }
}

function normalizeEvalResult(raw: unknown): string[] | null {
  if (Array.isArray(raw)) {
    return raw.map((x) => (typeof x === "string" ? x : String(x)));
  }
  return null;
}
