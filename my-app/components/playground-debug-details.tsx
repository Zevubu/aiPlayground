import type { PlaygroundDebugMetadata, PlaygroundUIMessage } from "@/lib/playground-types";

export function textFromMessage(m: PlaygroundUIMessage) {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function PlaygroundDebugDetailsBody({
  debug,
  emptyHint = "Run a completion to see timings, usage, and request summary.",
}: {
  debug: PlaygroundDebugMetadata | null;
  emptyHint?: string;
}) {
  if (!debug) {
    return <p className="text-zinc-500">{emptyHint}</p>;
  }

  return (
    <>
      <section>
        <h3 className="mb-1 text-[10px] font-semibold uppercase text-zinc-500">Timings (ms)</h3>
        <ul className="space-y-0.5">
          <li>Total: {debug.timings.totalMs}</li>
          <li>TTFB (first token): {debug.timings.ttffMs ?? "—"}</li>
        </ul>
      </section>
      <section>
        <h3 className="mb-1 text-[10px] font-semibold uppercase text-zinc-500">Usage</h3>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-zinc-100 p-2 dark:bg-zinc-950">
          {JSON.stringify(debug.usage ?? {}, null, 2)}
        </pre>
      </section>
      <section>
        <h3 className="mb-1 text-[10px] font-semibold uppercase text-zinc-500">Finish</h3>
        <p>{debug.finishReason ?? "—"}</p>
      </section>
      <details className="rounded border border-zinc-200 dark:border-zinc-700">
        <summary className="cursor-pointer px-2 py-1 text-[10px] font-medium">Request summary</summary>
        <pre className="max-h-40 overflow-auto border-t border-zinc-200 p-2 dark:border-zinc-700">
          {JSON.stringify(debug.requestSummary, null, 2)}
        </pre>
      </details>
      <details className="rounded border border-zinc-200 dark:border-zinc-700">
        <summary className="cursor-pointer px-2 py-1 text-[10px] font-medium">Full debug JSON</summary>
        <pre className="max-h-48 overflow-auto border-t border-zinc-200 p-2 dark:border-zinc-700">
          {JSON.stringify(debug, null, 2)}
        </pre>
      </details>
    </>
  );
}
