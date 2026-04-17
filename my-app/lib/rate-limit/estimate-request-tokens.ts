import type { UIMessage } from "ai";
import { resolveMaxOutputTokens } from "@/lib/chat-params";

export type ChatRequestForEstimate = {
  messages: UIMessage[];
  system?: string;
  maxTokens?: number;
};

function charsFromUiMessages(messages: UIMessage[], perMessageOverhead: number): number {
  let total = 0;
  for (const m of messages) {
    total += perMessageOverhead;
    for (const p of m.parts) {
      if (p.type === "text") {
        total += p.text.length;
      }
    }
  }
  return total;
}

/**
 * Rough token estimate for rate limiting (not billing): ~4 chars per token for Latin text,
 * plus reserved completion budget and per-message overhead.
 */
export function estimateChatRequestTokens(
  body: ChatRequestForEstimate,
  options: { defaultMaxOutputTokens: number; perMessageOverhead: number },
): number {
  const charCount =
    charsFromUiMessages(body.messages, options.perMessageOverhead) +
    (typeof body.system === "string" ? body.system.length : 0);
  const inputTokens = Math.ceil(charCount / 4);
  const maxOut =
    resolveMaxOutputTokens(body.maxTokens) ?? options.defaultMaxOutputTokens;
  return inputTokens + maxOut;
}
