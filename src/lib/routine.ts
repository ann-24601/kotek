/* =============================================================
   Kotek — analityka rozkładu dziennego (Home „Dzisiaj").
   Wszystko liczone z modelu DZIENNEGO (1 DayLog/dzień) — bez
   znaczników czasu zdarzeń. Trzy „ciekawe" wglądy:
   1) indeks rutyny (regularność metryk),
   2) „co poprzedza problem" (korelacja dzień-do-dnia),
   3) siatka kalendarzowa miauczenia (heatmapa dni).
   ============================================================= */

import type { DayLog, DayMetrics } from "./types";
import { METRICS } from "./constants";
import { daysAgo } from "./dates";

function mode(arr: number[]): number | null {
  if (!arr.length) return null;
  const c: Record<number, number> = {};
  arr.forEach((v) => (c[v] = (c[v] || 0) + 1));
  return +Object.keys(c).reduce((a, b) => (c[+b] > c[+a] ? b : a));
}

/* --------------------------------------------------------------
   1) Indeks rutyny — jak regularne są metryki kota.
   Dla każdej metryki: udział dni z najczęstszą wartością.
   Indeks = średnia z metryk (0–100%).
   -------------------------------------------------------------- */
export interface MetricConsistency {
  key: keyof DayMetrics;
  label: string;
  consistency: number; // 0..1
}
export interface RoutineIndex {
  pct: number | null;
  perMetric: MetricConsistency[];
  mostStable: MetricConsistency | null;
  mostIrregular: MetricConsistency | null;
}

export function routineIndex(logs: DayLog[], win = 21): RoutineIndex {
  const from = daysAgo(win);
  const scoped = logs.filter((l) => l.date >= from);
  const perMetric: MetricConsistency[] = [];

  for (const m of METRICS) {
    const vals = scoped
      .map((l) => l.m?.[m.key])
      .filter((v): v is number => v != null);
    if (vals.length < 3) continue;
    const md = mode(vals)!;
    const consistency = vals.filter((v) => v === md).length / vals.length;
    perMetric.push({ key: m.key, label: m.label, consistency });
  }

  if (perMetric.length === 0) {
    return { pct: null, perMetric, mostStable: null, mostIrregular: null };
  }

  const avg = perMetric.reduce((s, x) => s + x.consistency, 0) / perMetric.length;
  const sorted = [...perMetric].sort((a, b) => b.consistency - a.consistency);
  return {
    pct: Math.round(avg * 100),
    perMetric,
    mostStable: sorted[0] ?? null,
    mostIrregular: sorted[sorted.length - 1] ?? null,
  };
}

/* --------------------------------------------------------------
   2) „Co poprzedza problem?" — dla dni z nasilonym miauczeniem
   (vocal ≥ 2: dużo / bardzo dużo) patrzymy
   na dzień POPRZEDNI i zliczamy powtarzające się warunki.
   -------------------------------------------------------------- */
export interface Preceder {
  label: string;
  count: number;
}
export interface PrecederResult {
  problemDays: number;
  preceders: Preceder[];
}

const dayBefore = (date: string): string => {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

export function precedersOfVocal(logs: DayLog[]): PrecederResult {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const isProblem = (l: DayLog) => (l.m?.vocal ?? -1) >= 2;

  const counts: Record<string, number> = {};
  let problemDays = 0;

  for (const l of logs) {
    if (!isProblem(l)) continue;
    const prev = byDate.get(dayBefore(l.date));
    if (!prev) continue;
    problemDays++;
    if ((prev.m?.zabawa ?? 2) === 0) counts["brak wieczornej zabawy"] = (counts["brak wieczornej zabawy"] || 0) + 1;
    else if ((prev.m?.zabawa ?? 2) === 1) counts["krótka zabawa"] = (counts["krótka zabawa"] || 0) + 1;
    if (prev.m?.apetyt != null && prev.m.apetyt !== 1) counts["nietypowy apetyt"] = (counts["nietypowy apetyt"] || 0) + 1;
    if ((prev.m?.aktywnosc ?? 2) <= 1) counts["niska aktywność"] = (counts["niska aktywność"] || 0) + 1;
    if ((prev.m?.vocal ?? 0) >= 2) counts["miauczenie też dzień wcześniej"] = (counts["miauczenie też dzień wcześniej"] || 0) + 1;
  }

  const preceders = Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return { problemDays, preceders };
}

/* --------------------------------------------------------------
   3) Siatka kalendarzowa miauczenia — ostatnie `weeks` tygodni,
   ułożone w kolumny (tygodnie) × 7 wierszy (dni tyg., pon=0).
   Zwraca komórki z wartością vocal (0..3) lub null (brak wpisu).
   -------------------------------------------------------------- */
export interface HeatCell {
  date: string;
  vocal: number | null;
  future: boolean;
}

export function vocalHeatmap(logs: DayLog[], weeks = 6): HeatCell[][] {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // koniec siatki = niedziela bieżącego tygodnia (pon=0..niedz=6)
  const dow = (today.getDay() + 6) % 7; // pon=0
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - dow));

  const cols: HeatCell[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(end);
      cur.setDate(end.getDate() - w * 7 - (6 - d));
      const ds = cur.toISOString().slice(0, 10);
      const log = byDate.get(ds);
      col.push({
        date: ds,
        vocal: log?.m?.vocal ?? null,
        future: ds > todayStr,
      });
    }
    cols.push(col);
  }
  return cols;
}
