"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Squiggle } from "@/components/Squiggle";
import { Art } from "@/components/Illustration";
import { DayDetail, stripHtml } from "@/components/DayDetail";
import { useCat } from "@/context/CatContext";
import { METRICS } from "@/lib/constants";
import { fmt } from "@/lib/dates";
import type { DayMetrics } from "@/lib/types";

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

export function Historia() {
  const { logs } = useCat();
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [openDate, setOpenDate] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...logs].sort((a, b) => {
        const cmp = a.date < b.date ? -1 : 1;
        return order === "desc" ? -cmp : cmp;
      }),
    [logs, order],
  );

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

      <ul className="m-0 flex list-none flex-col p-0">
        {sorted.map((l, i) => {
          const noteText = l.note ? stripHtml(l.note) : "";
          const summary = noteText || metricSummary(l.m) || "Wpis dnia";
          return (
            <li key={l.date}>
              {i > 0 && <Squiggle className="opacity-70" />}
              <button
                type="button"
                onClick={() => setOpenDate(l.date)}
                className="flex w-full items-center gap-3 py-3 text-left text-sm leading-normal transition-colors hover:text-ink active:opacity-70"
              >
                <span className="min-w-[52px] shrink-0 font-semibold text-ink-faint">
                  {fmt(l.date)}
                </span>
                <span className="line-clamp-2 flex-1">{summary}</span>
                {l.photos && l.photos.length > 0 && (
                  <Icon name="note" size={16} className="shrink-0 text-ink-faint" />
                )}
                <Icon name="arrowRight" size={18} className="shrink-0 text-ink-faint" />
              </button>
            </li>
          );
        })}
      </ul>

      {openLog && <DayDetail log={openLog} onClose={() => setOpenDate(null)} />}
    </div>
  );
}
