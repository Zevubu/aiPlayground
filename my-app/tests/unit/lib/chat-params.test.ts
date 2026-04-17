import { describe, expect, it } from "vitest";
import {
  DEFAULT_MODEL_ID,
  normalizeBaseUrl,
  resolveMaxOutputTokens,
  resolveModelId,
  resolveTemperature,
  systemPromptFromBody,
} from "@/lib/chat-params";

describe("normalizeBaseUrl", () => {
  it("strips a single trailing slash", () => {
    expect(normalizeBaseUrl("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1");
  });

  it("leaves URLs without trailing slash unchanged", () => {
    expect(normalizeBaseUrl("https://api.openai.com/v1")).toBe("https://api.openai.com/v1");
  });
});

describe("resolveModelId", () => {
  it("returns default when model is missing or blank", () => {
    expect(resolveModelId(undefined)).toBe(DEFAULT_MODEL_ID);
    expect(resolveModelId("")).toBe(DEFAULT_MODEL_ID);
    expect(resolveModelId("   ")).toBe(DEFAULT_MODEL_ID);
    expect(resolveModelId(42)).toBe(DEFAULT_MODEL_ID);
  });

  it("trims a non-empty model id", () => {
    expect(resolveModelId("  gpt-4o  ")).toBe("gpt-4o");
  });
});

describe("resolveTemperature", () => {
  it("returns undefined for non-finite numbers", () => {
    expect(resolveTemperature(undefined)).toBeUndefined();
    expect(resolveTemperature("hot")).toBeUndefined();
    expect(resolveTemperature(Number.NaN)).toBeUndefined();
    expect(resolveTemperature(Number.POSITIVE_INFINITY)).toBeUndefined();
  });

  it("returns finite numbers", () => {
    expect(resolveTemperature(0)).toBe(0);
    expect(resolveTemperature(0.7)).toBe(0.7);
  });
});

describe("resolveMaxOutputTokens", () => {
  it("returns undefined unless given a finite number", () => {
    expect(resolveMaxOutputTokens(undefined)).toBeUndefined();
    expect(resolveMaxOutputTokens(1024)).toBe(1024);
  });
});

describe("systemPromptFromBody", () => {
  it("coerces non-strings to empty string", () => {
    expect(systemPromptFromBody(undefined)).toBe("");
    expect(systemPromptFromBody(null)).toBe("");
    expect(systemPromptFromBody(1)).toBe("");
  });

  it("preserves string content", () => {
    expect(systemPromptFromBody("You are a tester.")).toBe("You are a tester.");
  });
});
