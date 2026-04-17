import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { estimateChatRequestTokens } from "@/lib/rate-limit/estimate-request-tokens";

function userMessage(text: string): UIMessage {
  return {
    id: "m1",
    role: "user",
    parts: [{ type: "text", text }],
  };
}

describe("estimateChatRequestTokens", () => {
  const defaults = { defaultMaxOutputTokens: 1000, perMessageOverhead: 50 };

  it("includes per-message overhead and completion reserve", () => {
    const n = estimateChatRequestTokens({ messages: [userMessage("abcd")] }, defaults);
    // chars: 50 overhead + 4 text + 0 system = 54 -> ceil(54/4)=14 input + 1000 max out = 1014
    expect(n).toBe(1014);
  });

  it("uses explicit maxTokens when provided", () => {
    const n = estimateChatRequestTokens(
      { messages: [userMessage("x")], maxTokens: 200 },
      defaults,
    );
    const input = Math.ceil((50 + 1) / 4); // 13
    expect(n).toBe(input + 200);
  });

  it("counts system prompt length", () => {
    const n = estimateChatRequestTokens(
      { messages: [userMessage("")], system: "1234567890" },
      defaults,
    );
    const chars = 50 + 10;
    expect(n).toBe(Math.ceil(chars / 4) + 1000);
  });
});
