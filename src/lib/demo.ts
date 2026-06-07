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
