import { describe, expect, it } from "vitest";
import { filterChatModelIds } from "@/lib/playground-models";

describe("filterChatModelIds", () => {
  it("keeps gpt chat models and sorts", () => {
    expect(filterChatModelIds(["gpt-4o-mini", "gpt-4o"])).toEqual(["gpt-4o", "gpt-4o-mini"]);
  });

  it("drops embeddings and similar", () => {
    expect(
      filterChatModelIds(["gpt-4o", "text-embedding-3-small", "text-embedding-ada-002", "whisper-1"]),
    ).toEqual(["gpt-4o"]);
  });

  it("keeps fine-tuned gpt ids", () => {
    expect(filterChatModelIds(["ft:gpt-3.5-turbo-0125:org:foo"])).toEqual(["ft:gpt-3.5-turbo-0125:org:foo"]);
  });

  it("drops completions instruct models", () => {
    expect(filterChatModelIds(["gpt-3.5-turbo-instruct"])).toEqual([]);
  });
});
