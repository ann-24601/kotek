"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Squiggle } from "@/components/Squiggle";
import { Art } from "@/components/Illustration";
import { DayDetail, stripHtml } from "@/components/DayDetail";
import { RoughBorder } from "@/components/RoughBorder";
import { useCat } from "@/context/CatContext";
import { METRICS } from "@/lib/constants";
import { fmt } from "@/lib/dates";
import type { DayLog, DayMetrics } from "@/lib/types";

/** krótkie podsumowanie metryk dnia (gdy brak notatki) */
function metricSummary(m: DayMetrics): string {
  const parts: string[] = [];
  for (const mt of METRICS) {
    const v = m?.[mt.key];
    if (v == null) continue;
    const l = mt.options.find((o) => o.v === v)?.l;
    if (l) parts.push(`${mt.label}: ${l.toLowerCase()}`);
  }
  return parts.join(" · ");
}

/** nagłówek grupy miesięcznej, np. "lipiec 2026" */
function monthLabel(date: string): string {
  const d = new Date(date + "T00:00");
  return d.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
}

interface Row {
  log: DayLog;
  summary: string;
}

export function Historia() {
  const { logs } = useCat();
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [query, setQuery] = useState("");
  const [openDate, setOpenDate] = useState<string | null>(null);

  const rows = useMemo<Row[]>(
    () =>
      [...logs]
        .sort((a, b) => {
          const cmp = a.date < b.date ? -1 : 1;
          return order === "desc" ? -cmp : cmp;
        })
        .map((l) => ({
          log: l,
          summary: (l.note ? stripHtml(l.note) : "") || metricSummary(l.m) || "Wpis dnia",
        })),
    [logs, order],
  );

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => r.summary.toLowerCase().includes(q) || r.log.date.includes(q))
    : rows;

  // grupy miesięczne w kolejności sortowania
  const groups = useMemo(() => {
    const out: { label: string; rows: Row[] }[] = [];
    for (const r of filtered) {
      const label = monthLabel(r.log.date);
      const last = out[out.length - 1];
      if (last && last.label === label) last.rows.push(r);
      else out.push({ label, rows: [r] });
    }
    return out;
  }, [filtered]);

  const openLog = openDate ? logs.find((l) => l.date === openDate) ?? null : null;

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 pt-10 text-center">
        <Art name="dziennik" size={180} />
        <h2 className="text-xl">Brak wpisów</h2>
        <p className="max-w-[38ch] text-sm text-ink-soft">
          Dodaj pierwszy wpis przyciskiem „+ Dodaj wpis". Zebrane dni pojawią się tutaj jako
          lista.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl leading-tight">Historia</h1>
          <p className="mt-1 text-sm text-ink-soft">Wszystkie wpisy dziennika ({logs.length}).</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
          className="shrink-0 px-2 py-1 text-xs font-medium"
        >
          <Icon name="sort" size={16} />
          {order === "desc" ? "Od najnowszych" : "Od najstarszych"}
        </Button>
      </header>

      {/* wyszukiwanie w notatkach i podsumowaniach */}
      <div className="relative rounded-[14px] bg-paper focus-within:outline focus-within:outline-[2.5px] focus-within:outline-dashed focus-within:outline-ink focus-within:outline-offset-[3px]">
        <RoughBorder radius={14} wavelength={22} amplitude={2.2} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj we wpisach…"
          aria-label="Szukaj we wpisach"
          className="min-h-11 w-full rounded-[var(--r-box)] bg-transparent px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="pt-6 text-center text-sm text-ink-soft">
          Nic nie znaleziono dla „{query}".
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.label}>
            <h2 className="mb-1 font-hand text-base font-semibold text-ink-soft first-letter:uppercase">
              {g.label}
            </h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {g.rows.map((r, i) => (
                <li key={r.log.date}>
                  {i > 0 && <Squiggle className="opacity-70" />}
                  <button
                    type="button"
                    onClick={() => setOpenDate(r.log.date)}
                    className="flex w-full items-center gap-3 py-3 text-left text-sm leading-normal transition-colors hover:text-ink active:opacity-70"
                  >
                    <span className="min-w-[52px] shrink-0 font-semibold text-ink-faint">
                      {fmt(r.log.date)}
                    </span>
                    <span className="line-clamp-2 flex-1">{r.summary}</span>
                    {r.log.photos && r.log.photos.length > 0 && (
                      <Icon name="camera" size={16} className="shrink-0 text-ink-faint" />
                    )}
                    <Icon name="arrowRight" size={18} className="shrink-0 text-ink-faint" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {openLog && <DayDetail log={openLog} onClose={() => setOpenDate(null)} />}
    </div>
  );
}
