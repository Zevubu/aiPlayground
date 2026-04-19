import { DEFAULT_MODEL_ID } from "@/lib/chat-params";

/**
 * Shown when /v1/models cannot be loaded (offline, non-OpenAI gateway, etc.).
 * Includes {@link DEFAULT_MODEL_ID} so the UI always matches API defaults.
 */
export const FALLBACK_PLAYGROUND_MODELS: string[] = [
  DEFAULT_MODEL_ID,
  "gpt-4o",
  "gpt-4o-2024-08-06",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
  "o1",
  "o1-mini",
  "o3-mini",
];

/** Dedupe, filter to likely Chat Completions models, sort for stable dropdowns. */
export function filterChatModelIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    if (!isLikelyChatCompletionModel(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function isLikelyChatCompletionModel(id: string): boolean {
  const lower = id.toLowerCase();
  if (lower.includes("embedding")) return false;
  if (lower.startsWith("text-embedding")) return false;
  if (lower.includes("whisper")) return false;
  if (lower.includes("tts")) return false;
  if (lower.includes("dall-e") || lower.includes("dall_e")) return false;
  if (lower.includes("moderation")) return false;
  if (lower.endsWith("-instruct")) return false;
  if (lower.includes("realtime")) return false;
  if (lower.includes("transcribe")) return false;
  if (lower.includes("omni-moderation")) return false;
  if (/^(davinci|curie|babbage|ada)([-_]|$)/i.test(lower)) return false;

  if (lower.startsWith("ft:")) {
    return /gpt-|o\d/i.test(id);
  }

  if (/^gpt-/i.test(id)) return true;
  if (/^chatgpt-/i.test(id)) return true;
  if (/^o\d/i.test(id)) return true;

  return false;
}
