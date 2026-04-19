"use client";

import { useMemo } from "react";
import { usePlaygroundModelOptions } from "@/hooks/use-playground-model-options";

const selectClassName =
  "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:focus:ring-zinc-600";

type ModelSelectProps = {
  id: string;
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
};

export function ModelSelect({ id, value, onChange, disabled, ...rest }: ModelSelectProps) {
  const models = usePlaygroundModelOptions();

  const options = useMemo(() => {
    if (models.includes(value)) return models;
    return [value, ...models];
  }, [models, value]);

  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={selectClassName}
      {...rest}
    >
      {options.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}
