import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  DEFAULT_OPENAI_BASE_URL,
  normalizeBaseUrl,
  resolveMaxOutputTokens,
  resolveModelId,
  resolveTemperature,
  systemPromptFromBody,
} from "@/lib/chat-params";
import type { PlaygroundDebugMetadata } from "@/lib/playground-types";

export const maxDuration = 60;

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
  baseURL: normalizeBaseUrl(process.env.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL),
});

type ChatRequestBody = {
  messages: UIMessage[];
  model?: string;
  temperature?: number;
  system?: string;
  maxTokens?: number;
  id?: string;
  trigger?: string;
  messageId?: string;
};

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, model, temperature, system, maxTokens } = body;

  if (!Array.isArray(messages)) {
    return Response.json({ error: "Expected messages array" }, { status: 400 });
  }

  const modelId = resolveModelId(model);
  const requestStart = Date.now();
  let firstTokenAt: number | null = null;

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Message conversion failed";
    return Response.json({ error: message }, { status: 400 });
  }

  const systemPrompt = systemPromptFromBody(system);
  const maxOutputTokens = resolveMaxOutputTokens(maxTokens);
  const temp = resolveTemperature(temperature);

  const requestSummary: PlaygroundDebugMetadata["requestSummary"] = {
    model: modelId,
    temperature: temp,
    maxOutputTokens,
    messageCount: messages.length,
    systemPromptChars: systemPrompt.length,
    roles: messages.map((m) => m.role),
  };

  try {
    const result = streamText({
      model: openaiProvider.chat(modelId),
      messages: modelMessages,
      system: systemPrompt.trim() ? systemPrompt : undefined,
      temperature: temp,
      maxOutputTokens,
      onChunk: ({ chunk }) => {
        if (
          firstTokenAt === null &&
          (chunk.type === "text-delta" || chunk.type === "reasoning-delta")
        ) {
          firstTokenAt = Date.now();
        }
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
          const complete = Date.now();
          const debug: PlaygroundDebugMetadata = {
            timings: {
              requestStart,
              firstToken: firstTokenAt,
              complete,
              ttffMs: firstTokenAt != null ? firstTokenAt - requestStart : null,
              totalMs: complete - requestStart,
            },
            usage: part.totalUsage,
            finishReason: part.finishReason,
            requestSummary,
          };
          return { debug };
        }
        return undefined;
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stream failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
