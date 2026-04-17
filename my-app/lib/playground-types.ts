import type { FinishReason, LanguageModelUsage, UIMessage } from "ai";

export type PlaygroundDebugMetadata = {
  timings: {
    requestStart: number;
    firstToken: number | null;
    complete: number;
    ttffMs: number | null;
    totalMs: number;
  };
  usage?: LanguageModelUsage;
  finishReason?: FinishReason;
  requestSummary: {
    model: string;
    temperature: number | undefined;
    maxOutputTokens: number | undefined;
    messageCount: number;
    systemPromptChars: number;
    roles: Array<"user" | "assistant" | "system">;
  };
};

export type PlaygroundUIMessage = UIMessage<{ debug: PlaygroundDebugMetadata }>;
