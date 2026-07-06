"use client";

import type { MetricOption } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Suwak intensywności — etykieta nad suwakiem zmienia się wraz z przesuwaniem. */
export function LabeledSlider({
  options,
  value,
  onChange,
  className,
}: {
  options: MetricOption[];
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const max = options.length - 1;
  const idx = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? (idx / max) * 100 : 0;
  const current = options[idx]?.l ?? "";

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 font-hand text-sm text-ink-soft">{current}</div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={idx}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={current}
        className="kotek-slider"
        style={{ background: `linear-gradient(to right, var(--ink) ${pct}%, var(--hairline) ${pct}%)` }}
      />
    </div>
  );
}
