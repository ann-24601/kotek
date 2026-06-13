/* Dane demo — scenariusz: nocne miauczenie + chowanie po przeprowadzce */

import type { DayLog } from "./types";
import { daysAgo } from "./dates";

export function demoLogs(): DayLog[] {
  const out: DayLog[] = [];
  for (let i = 20; i >= 0; i--) {
    const recent = i <= 6;
    out.push({
      date: daysAgo(i),
      m: {
        aktywnosc: recent ? (i % 2 ? 1 : 0) : 2,
        apetyt: recent && i < 3 ? 0 : 1,
        vocal: recent ? (i < 4 ? 3 : 2) : 1,
        zabawa: recent ? (i % 2 ? 1 : 0) : 2,
      },
      note: i === 18 ? "Wprowadziliśmy się do nowego mieszkania." : "",
    });
  }
  return out;
}

/**
 * Scala dane demo z istniejącymi wpisami bez utraty danych: istniejące wpisy
 * mają pierwszeństwo (demo uzupełnia tylko brakujące dni). Dzięki temu „wczytaj
 * demo" na koncie z realną historią niczego nie nadpisuje ani nie kasuje.
 */
export function mergeLogs(existing: DayLog[], demo: DayLog[]): DayLog[] {
  const byDate = new Map<string, DayLog>();
  for (const d of demo) byDate.set(d.date, d);
  for (const e of existing) byDate.set(e.date, e);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
