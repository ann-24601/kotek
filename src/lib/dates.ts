/* Pomocnicze funkcje dat (PL) */

export const todayStr = (): string => new Date().toISOString().slice(0, 10);

export const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export const fmt = (s: string): string => {
  const d = new Date(s + "T00:00");
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
};

export const fmtLong = (s: string): string => {
  const d = new Date(s + "T00:00");
  return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
};
