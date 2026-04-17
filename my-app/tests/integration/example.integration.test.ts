import { describe, expect, it } from "vitest";
import { DEFAULT_OPENAI_BASE_URL, normalizeBaseUrl } from "@/lib/chat-params";

/**
 * Lightweight integration-style check: real modules resolve without a dev server.
 * Add HTTP-level tests with mocked fetch when you need route coverage.
 */
describe("integration smoke", () => {
  it("loads shared lib through the same path alias as the app", () => {
    expect(normalizeBaseUrl(DEFAULT_OPENAI_BASE_URL)).toBe("https://api.openai.com/v1");
  });
});
