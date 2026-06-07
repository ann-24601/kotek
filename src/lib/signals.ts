/* =============================================================
   Kotek — silnik sygnałów (deviation detection, PRD 8.7)
   Uczy się normy kota i wykrywa odchylenia ostatnich 7 dni.
   ============================================================= */

import type { DayLog } from "./types";
import { METRICS, MIN_DAYS, WIN } from "./constants";
import type { IconName } from "../components/Icon";

export interface Signal {
  key: string;
  label: string;
  icon: IconName;
  sev: "high" | "med";
  text: string;
}

export interface SignalResult {
  sigs: Signal[];
  ready: boolean;
  have: number;
}

function mode(arr: number[]): number | null {
  if (!arr.length) return null;
  const c: Record<number, number> = {};
  arr.forEach((v) => (c[v] = (c[v] || 0) + 1));
  return +Object.keys(c).reduce((a, b) => (c[+b] > c[+a] ? b : a));
}

export function computeSignals(logs: DayLog[]): SignalResult {
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1));
  const recent = sorted.slice(0, WIN);
  const sigs: Signal[] = [];
  if (logs.length < MIN_DAYS) return { sigs, ready: false, have: logs.length };

  METRICS.forEach((m) => {
    const all = logs.filter((l) => l.m && l.m[m.key] != null).map((l) => l.m[m.key]!) as number[];
    const older = sorted
      .slice(WIN)
      .filter((l) => l.m && l.m[m.key] != null)
      .map((l) => l.m[m.key]!) as number[];
    const base = mode(older.length >= 3 ? older : all);
    if (base == null) return;
    const recVals = recent
      .filter((l) => l.m && l.m[m.key] != null)
      .map((l) => l.m[m.key]!) as number[];
    if (recVals.length < 3) return;

    // czerwona flaga (np. „Nie je")
    if (m.red && recVals.some((v) => m.red!.includes(v))) {
      const flag = m.options.find((o) => m.red!.includes(o.v));
      sigs.unshift({
        key: m.key,
        label: m.label,
        icon: m.icon,
        sev: "high",
        text: `„${flag?.l}" w ostatnich dniach`,
      });
      return;
    }

    let off: number[];
    if (m.concern === "low") off = recVals.filter((v) => v < base);
    else if (m.concern === "high") off = recVals.filter((v) => v > base);
    else off = recVals.filter((v) => v !== base);

    if (off.length >= 3 && off.length / recVals.length >= 0.5) {
      const dir =
        m.concern === "low"
          ? "poniżej normy"
          : m.concern === "high"
            ? "powyżej normy"
            : "inaczej niż zwykle";
      sigs.push({
        key: m.key,
        label: m.label,
        icon: m.icon,
        sev: "med",
        text: `${off.length} z ${recVals.length} ostatnich dni ${dir}`,
      });
    }
  });

  return { sigs, ready: true, have: logs.length };
}
