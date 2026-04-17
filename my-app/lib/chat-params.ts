/** Pure helpers for resolving chat API parameters (unit-tested, TDD-friendly). */

export const DEFAULT_MODEL_ID = "gpt-4o-mini";
export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function resolveModelId(model: unknown): string {
  return typeof model === "string" && model.trim() ? model.trim() : DEFAULT_MODEL_ID;
}

export function resolveTemperature(temperature: unknown): number | undefined {
  return typeof temperature === "number" && Number.isFinite(temperature)
    ? temperature
    : undefined;
}

export function resolveMaxOutputTokens(maxTokens: unknown): number | undefined {
  return typeof maxTokens === "number" && Number.isFinite(maxTokens) ? maxTokens : undefined;
}

export function systemPromptFromBody(system: unknown): string {
  return typeof system === "string" ? system : "";
}
