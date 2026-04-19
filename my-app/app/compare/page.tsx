"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo, useState } from "react";
import { ModelSelect } from "@/components/model-select";
import { PlaygroundDebugDetailsBody, textFromMessage } from "@/components/playground-debug-details";
import type { PlaygroundDebugMetadata, PlaygroundUIMessage } from "@/lib/playground-types";

const RATE_LIMIT_COPY =
  "Rate limit reached. Wait a bit or lower traffic, then try again (see Retry-After from the API).";

export default function ComparePage() {
  const [modelA, setModelA] = useState("gpt-4o-mini");
  const [modelB, setModelB] = useState("gpt-4o");
  const [temperature, setTemperature] = useState(0.7);
  const [system, setSystem] = useState("");
  const [maxOutputTokens, setMaxOutputTokens] = useState<number | "">("");
  const [lastDebugA, setLastDebugA] = useState<PlaygroundDebugMetadata | null>(null);
  const [lastDebugB, setLastDebugB] = useState<PlaygroundDebugMetadata | null>(null);
  const [rateLimitNoticeA, setRateLimitNoticeA] = useState<string | null>(null);
  const [rateLimitNoticeB, setRateLimitNoticeB] = useState<string | null>(null);

  const sharedBody = useMemo(
    () => ({
      temperature,
      system,
      maxTokens:
        maxOutputTokens === "" || maxOutputTokens === undefined ? undefined : Number(maxOutputTokens),
    }),
    [temperature, system, maxOutputTokens],
  );

  const transportA = useMemo(
    () =>
      new DefaultChatTransport<PlaygroundUIMessage>({
        api: "/api/chat",
        body: () => ({ ...sharedBody, model: modelA }),
      }),
    [modelA, sharedBody],
  );

  const transportB = useMemo(
    () =>
      new DefaultChatTransport<PlaygroundUIMessage>({
        api: "/api/chat",
        body: () => ({ ...sharedBody, model: modelB }),
      }),
    [modelB, sharedBody],
  );

  const {
    messages: messagesA,
    sendMessage: sendMessageA,
    status: statusA,
    error: errorA,
    stop: stopA,
    setMessages: setMessagesA,
  } = useChat<PlaygroundUIMessage>({
    id: "playground-compare-a",
    transport: transportA,
    onFinish: ({ message }) => {
      const d = message.metadata?.debug;
      if (d) setLastDebugA(d);
    },
    onError: (e) => {
      if (/rate limit|429|too many requests/i.test(e.message)) {
        setRateLimitNoticeA(RATE_LIMIT_COPY);
      }
    },
  });

  const {
    messages: messagesB,
    sendMessage: sendMessageB,
    status: statusB,
    error: errorB,
    stop: stopB,
    setMessages: setMessagesB,
  } = useChat<PlaygroundUIMessage>({
    id: "playground-compare-b",
    transport: transportB,
    onFinish: ({ message }) => {
      const d = message.metadata?.debug;
      if (d) setLastDebugB(d);
    },
    onError: (e) => {
      if (/rate limit|429|too many requests/i.test(e.message)) {
        setRateLimitNoticeB(RATE_LIMIT_COPY);
      }
    },
  });

  const busyA = statusA === "submitted" || statusA === "streaming";
  const busyB = statusB === "submitted" || statusB === "streaming";
  const busy = busyA || busyB;

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const field = form.elements.namedItem("prompt") as HTMLTextAreaElement;
      const text = field.value.trim();
      if (!text || busy) return;
      field.value = "";
      setRateLimitNoticeA(null);
      setRateLimitNoticeB(null);
      await Promise.all([sendMessageA({ text }), sendMessageB({ text })]);
    },
    [busy, sendMessageA, sendMessageB],
  );

  const clearChat = useCallback(() => {
    setMessagesA([]);
    setMessagesB([]);
    setLastDebugA(null);
    setLastDebugB(null);
    setRateLimitNoticeA(null);
    setRateLimitNoticeB(null);
  }, [setMessagesA, setMessagesB]);

  const stopAll = useCallback(() => {
    void stopA();
    void stopB();
  }, [stopA, stopB]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 lg:flex-row">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col border-zinc-200 dark:border-zinc-800 lg:border-r">
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h1 className="text-sm font-semibold tracking-tight">Compare models</h1>
          <div className="flex gap-2">
            {busy ? (
              <button
                type="button"
                onClick={stopAll}
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

        <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-zinc-200 dark:divide-zinc-800 md:grid-cols-2 md:divide-x md:divide-y-0">
          <section className="flex min-h-0 min-w-0 flex-col">
            <div className="shrink-0 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{modelA}</p>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {messagesA.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Responses for model A appear here.</p>
              ) : null}
              {messagesA.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1 rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "ml-4 bg-zinc-200/80 dark:bg-zinc-800"
                      : "mr-4 border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {m.role}
                  </span>
                  <div className="whitespace-pre-wrap">{textFromMessage(m)}</div>
                </div>
              ))}
            </div>
            {rateLimitNoticeA ? (
              <div className="shrink-0 border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                {rateLimitNoticeA}
              </div>
            ) : null}
            {errorA ? (
              <div className="shrink-0 border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
                {errorA.message}
              </div>
            ) : null}
          </section>

          <section className="flex min-h-0 min-w-0 flex-col">
            <div className="shrink-0 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{modelB}</p>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {messagesB.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Responses for model B appear here.</p>
              ) : null}
              {messagesB.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1 rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "ml-4 bg-zinc-200/80 dark:bg-zinc-800"
                      : "mr-4 border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {m.role}
                  </span>
                  <div className="whitespace-pre-wrap">{textFromMessage(m)}</div>
                </div>
              ))}
            </div>
            {rateLimitNoticeB ? (
              <div className="shrink-0 border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                {rateLimitNoticeB}
              </div>
            ) : null}
            {errorB ? (
              <div className="shrink-0 border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
                {errorB.message}
              </div>
            ) : null}
          </section>
        </div>

        <form onSubmit={onSubmit} className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <label className="sr-only" htmlFor="compare-prompt">
            Message
          </label>
          <textarea
            id="compare-prompt"
            name="prompt"
            rows={3}
            disabled={busy}
            placeholder="Same prompt is sent to both models…"
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:ring-zinc-600"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Send to both
            </button>
          </div>
        </form>
      </main>

      <aside className="flex w-full shrink-0 flex-col border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:w-[380px] lg:border-t-0 lg:border-l">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold tracking-tight">Parameters</h2>
        </div>
        <div className="space-y-4 overflow-y-auto px-4 py-4 text-sm">
          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            Each send runs two <code className="font-mono text-[11px]">/api/chat</code> requests. If rate limiting
            is enabled, both count toward your limits.
          </p>
          <div className="space-y-1">
            <label htmlFor="model-a" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Model A
            </label>
            <ModelSelect id="model-a" value={modelA} onChange={setModelA} disabled={busy} />
          </div>
          <div className="space-y-1">
            <label htmlFor="model-b" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Model B
            </label>
            <ModelSelect id="model-b" value={modelB} onChange={setModelB} disabled={busy} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <label htmlFor="compare-temp" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Temperature
              </label>
              <span className="font-mono text-xs text-zinc-500">{temperature}</span>
            </div>
            <input
              id="compare-temp"
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
            <label htmlFor="compare-maxtok" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Max output tokens (optional)
            </label>
            <input
              id="compare-maxtok"
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
            <label htmlFor="compare-system" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              System prompt
            </label>
            <textarea
              id="compare-system"
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
          <details open className="group border-b border-zinc-200 dark:border-zinc-800">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Debug · A</summary>
            <div className="max-h-[min(28vh,280px)] space-y-3 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
              <PlaygroundDebugDetailsBody debug={lastDebugA} emptyHint="No completion yet for model A." />
            </div>
          </details>
          <details open className="group">
            <summary className="cursor-pointer border-b border-zinc-200 px-4 py-3 text-sm font-semibold dark:border-zinc-800">
              Debug · B
            </summary>
            <div className="max-h-[min(28vh,280px)] space-y-3 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
              <PlaygroundDebugDetailsBody debug={lastDebugB} emptyHint="No completion yet for model B." />
            </div>
          </details>
        </div>
      </aside>
    </div>
  );
}
