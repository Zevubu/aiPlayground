import { DEFAULT_OPENAI_BASE_URL, normalizeBaseUrl } from "@/lib/chat-params";
import { FALLBACK_PLAYGROUND_MODELS, filterChatModelIds } from "@/lib/playground-models";

export const dynamic = "force-dynamic";

type OpenAIModelsResponse = {
  data?: Array<{ id: string }>;
};

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseURL = normalizeBaseUrl(process.env.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL);

  if (!apiKey) {
    return Response.json(
      { models: [...FALLBACK_PLAYGROUND_MODELS] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const res = await fetch(`${baseURL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return Response.json(
        { models: [...FALLBACK_PLAYGROUND_MODELS] },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const json = (await res.json()) as OpenAIModelsResponse;
    const raw = (json.data ?? []).map((m) => m.id);
    const filtered = filterChatModelIds(raw);

    return Response.json(
      {
        models: filtered.length > 0 ? filtered : [...FALLBACK_PLAYGROUND_MODELS],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { models: [...FALLBACK_PLAYGROUND_MODELS] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
