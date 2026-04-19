"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo, useState } from "react";
import { ModelSelect } from "@/components/model-select";
import { PlaygroundDebugDetailsBody, textFromMessage } from "@/components/playground-debug-details";
import type { PlaygroundDebugMetadata, PlaygroundUIMessage } from "@/lib/playground-types";

export default function Home() {
  const [model, setModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.7);
  const [system, setSystem] = useState("");
  const [maxOutputTokens, setMaxOutputTokens] = useState<number | "">("");
  const [lastDebug, setLastDebug] = useState<PlaygroundDebugMetadata | null>(null);
  const [rateLimitNotice, setRateLimitNotice] = useState<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<PlaygroundUIMessage>({
        api: "/api/chat",
        body: () => ({
          model,
          temperature,
          system,
          maxTokens:
            maxOutputTokens === "" || maxOutputTokens === undefined
              ? undefined
              : Number(maxOutputTokens),
        }),
      }),
    [model, temperature, system, maxOutputTokens],
  );

  const { messages, sendMessage, status, error, stop, setMessages } = useChat<PlaygroundUIMessage>({
    transport,
    onFinish: ({ message }) => {
      const d = message.metadata?.debug;
      if (d) setLastDebug(d);
    },
    onError: (e) => {
      if (/rate limit|429|too many requests/i.test(e.message)) {
        setRateLimitNotice(
          "Rate limit reached. Wait a bit or lower traffic, then try again (see Retry-After from the API).",
        );
      }
    },
  });

  const busy = status === "submitted" || status === "streaming";

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const field = form.elements.namedItem("prompt") as HTMLTextAreaElement;
      const text = field.value.trim();
      if (!text || busy) return;
      field.value = "";
      setRateLimitNotice(null);
      await sendMessage({ text });
    },
    [busy, sendMessage],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setLastDebug(null);
  }, [setMessages]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 lg:flex-row">
      <main className="flex min-h-0 flex-1 flex-col border-zinc-200 dark:border-zinc-800 lg:border-r">
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h1 className="text-sm font-semibold tracking-tight">Chat</h1>
          <div className="flex gap-2">
            {busy ? (
              <button
                type="button"
                onClick={() => void stop()}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                Stop
              </button>
            ) : null}
            <button
              type="button"
              onClick={clearChat}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Clear
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Send a message to talk to the model. Adjust parameters on the right. API keys stay on the
              server via <code className="font-mono text-xs">.env.local</code>.
            </p>
          ) : null}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col gap-1 rounded-lg px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-8 bg-zinc-200/80 dark:bg-zinc-800"
                  : "mr-8 border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {m.role}
              </span>
              <div className="whitespace-pre-wrap">{textFromMessage(m)}</div>
            </div>
          ))}
        </div>

        {rateLimitNotice ? (
          <div className="shrink-0 border-t border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            {rateLimitNotice}
          </div>
        ) : null}
        {error ? (
          <div className="shrink-0 border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            {error.message}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <label className="sr-only" htmlFor="prompt">
            Message
          </label>
          <textarea
            id="prompt"
            name="prompt"
            rows={3}
            disabled={busy}
            placeholder="Type a message…"
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:ring-zinc-600"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Send
            </button>
          </div>
        </form>
      </main>

      <aside className="flex w-full shrink-0 flex-col border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:w-[380px] lg:border-t-0 lg:border-l">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold tracking-tight">Parameters</h2>
        </div>
        <div className="space-y-4 overflow-y-auto px-4 py-4 text-sm">
          <div className="space-y-1">
            <label htmlFor="model" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Model
            </label>
            <ModelSelect id="model" value={model} onChange={setModel} disabled={busy} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <label htmlFor="temp" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Temperature
              </label>
              <span className="font-mono text-xs text-zinc-500">{temperature}</span>
            </div>
            <input
              id="temp"
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              disabled={busy}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="maxtok" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Max output tokens (optional)
            </label>
            <input
              id="maxtok"
              type="number"
              min={1}
              placeholder="Default (provider)"
              value={maxOutputTokens}
              onChange={(e) => {
                const v = e.target.value;
                setMaxOutputTokens(v === "" ? "" : Number(v));
              }}
              disabled={busy}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:focus:ring-zinc-600"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="system" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              System prompt
            </label>
            <textarea
              id="system"
              rows={5}
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              disabled={busy}
              placeholder="Optional instructions sent only to the API…"
              className="w-full resize-y rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:focus:ring-zinc-600"
            />
          </div>
        </div>

        <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800">
          <details open className="group">
            <summary className="cursor-pointer border-b border-zinc-200 px-4 py-3 text-sm font-semibold dark:border-zinc-800">
              Debug
            </summary>
            <div className="max-h-[min(50vh,420px)] space-y-3 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
              <PlaygroundDebugDetailsBody debug={lastDebug} />
            </div>
          </details>
        </div>
      </aside>
    </div>
  );
}
