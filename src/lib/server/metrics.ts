/* =============================================================
   Kotek — walidacja metryk wpisu.
   Zakresy wyprowadzone z METRICS (constants.ts) — bez hardkodu.
   ============================================================= */
import { METRICS } from "@/lib/constants";
import type { DayMetrics } from "@/lib/types";

const RANGES: Record<string, [number, number]> = Object.fromEntries(
  METRICS.map((m) => {
    const vals = m.options.map((o) => o.v);
    return [m.key, [Math.min(...vals), Math.max(...vals)]];
  }),
);

export type ValidateResult = { metrics: DayMetrics } | { error: string };

export function validateMetrics(input: unknown): ValidateResult {
  if (typeof input !== "object" || input === null) {
    return { error: "Pole 'metrics' jest wymagane (obiekt z 4 metrykami)." };
  }
  const rec = input as Record<string, unknown>;
  const metrics: Record<string, number> = {};
  for (const [key, [lo, hi]] of Object.entries(RANGES)) {
    const val = rec[key];
    if (typeof val !== "number" || !Number.isInteger(val) || val < lo || val > hi) {
      return { error: `Metryka '${key}' musi być liczbą całkowitą ${lo}..${hi}.` };
    }
    metrics[key] = val;
  }
  return { metrics: metrics as DayMetrics };
}
