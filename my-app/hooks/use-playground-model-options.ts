"use client";

import { useEffect, useState } from "react";
import { FALLBACK_PLAYGROUND_MODELS } from "@/lib/playground-models";

let sharedCache: string[] | null = null;
let sharedInflight: Promise<string[]> | null = null;

function loadModels(): Promise<string[]> {
  if (sharedCache) return Promise.resolve(sharedCache);
  if (sharedInflight) return sharedInflight;

  sharedInflight = fetch("/api/models")
    .then(async (r) => {
      const data = (await r.json()) as { models?: string[] };
      const list =
        r.ok && Array.isArray(data.models) && data.models.length > 0
          ? data.models
          : [...FALLBACK_PLAYGROUND_MODELS];
      sharedCache = list;
      return list;
    })
    .catch(() => {
      const list = [...FALLBACK_PLAYGROUND_MODELS];
      sharedCache = list;
      return list;
    })
    .finally(() => {
      sharedInflight = null;
    });

  return sharedInflight;
}

/** Model id list for dropdowns; dedupes fetches across the app. */
export function usePlaygroundModelOptions(): string[] {
  const [models, setModels] = useState<string[]>(() => sharedCache ?? FALLBACK_PLAYGROUND_MODELS);

  useEffect(() => {
    void loadModels().then(setModels);
  }, []);

  return models;
}
