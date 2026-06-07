"use client";

import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { useCat } from "@/context/CatContext";
import { METRICS, WIN, type Metric } from "@/lib/constants";
import { fmt, fmtLong, daysAgo } from "@/lib/dates";
import type { DayLog } from "@/lib/types";
import { cn } from "@/lib/utils";

function mode(arr: number[]): number | null {
  if (!arr.length) return null;
  const c: Record<number, number> = {};
  arr.forEach((v) => (c[v] = (c[v] || 0) + 1));
  return +Object.keys(c).reduce((a, b) => (c[+b] > c[+a] ? b : a));
}

/** notatki są HTML (TipTap) — do listy pokazujemy czysty tekst */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** etykieta opcji metryki dla danej wartości */
function optLabel(key: keyof DayLog["m"], v: number | undefined): string {
  if (v == null) return "—";
  const mt = METRICS.find((x) => x.key === key);
  return mt?.options.find((o) => o.v === v)?.l ?? "—";
}

/* --- zakresy czasu dla wykresu --- */
const RANGES = [
  { d: 7, l: "Tydzień" },
  { d: 30, l: "Miesiąc" },
  { d: 180, l: "6 miesięcy" },
] as const;

/* --- prosty wykres liniowy w stylu odręcznym (czysty SVG) --- */
function LineChart({
  logs,
  metricKey,
  options,
  base,
}: {
  logs: DayLog[];
  metricKey: keyof DayLog["m"];
  options: { v: number; l: string }[];
  base: number | null;
}) {
  const W = 340;
  const H = 210;
  const padL = 64;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxV = Math.max(...options.map((o) => o.v));

  const data = useMemo(
    () =>
      [...logs]
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .map((l) => ({ date: l.date, v: l.m?.[metricKey] })),
    [logs, metricKey],
  );

  const pts = data
    .map((d, i) => ({ ...d, i }))
    .filter((d) => d.v != null) as { date: string; v: number; i: number }[];

  const n = data.length;
  const x = (i: number) => padL + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const y = (v: number) => padT + (1 - v / maxV) * plotH;

  const line = pts.map((p) => `${x(p.i)},${y(p.v)}`).join(" ");
  const xTicks = data.length
    ? [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i)
    : [];
  // przy gęstym zakresie (6 mies.) chowamy kropki, by linia była czytelna
  const showDots = pts.length <= 45;

  const labelStyle = {
    fill: "var(--ink-soft)",
    fontFamily: "var(--font-mono)",
    fontSize: 8,
  } as const;

  return (
    <svg
      className="block h-auto w-full"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Wykres przebiegu wskaźnika"
    >
      {/* siatka pozioma (kropkowana) */}
      {options.map((o) => (
        <line
          key={o.v}
          x1={padL}
          x2={W - padR}
          y1={y(o.v)}
          y2={y(o.v)}
          stroke="var(--dot)"
          strokeWidth={1}
          strokeDasharray="1 5"
          strokeLinecap="round"
        />
      ))}
      {/* pas normy */}
      {base != null && (
        <rect x={padL} y={y(base) - 9} width={plotW} height={18} fill="var(--ink)" opacity={0.08} />
      )}
      {/* etykiety Y */}
      {options.map((o) => (
        <text key={o.v} x={padL - 8} y={y(o.v) + 3} style={labelStyle} textAnchor="end">
          {o.l.length > 9 ? o.l.slice(0, 8) + "…" : o.l}
        </text>
      ))}
      {/* linia */}
      {pts.length > 1 && (
        <polyline
          points={line}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {/* punkty */}
      {showDots &&
        pts.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={3.2} fill="var(--ink)" />)}
      {/* etykiety X */}
      {xTicks.map((i) => (
        <text key={i} x={x(i)} y={H - 8} style={labelStyle} textAnchor="middle">
          {fmt(data[i].date)}
        </text>
      ))}
    </svg>
  );
}

/* --- pojedynczy „slajd" karuzeli: wykres jednej metryki --- */
function MetricPanel({ metric, logs, range }: { metric: Metric; logs: DayLog[]; range: number }) {
  const sel = metric.key;

  const rangedLogs = useMemo(() => {
    const from = daysAgo(range);
    return logs.filter((l) => l.date >= from);
  }, [logs, range]);

  const base = useMemo(() => {
    const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1));
    const older = sorted
      .slice(WIN)
      .filter((l) => l.m?.[sel] != null)
      .map((l) => l.m[sel]!) as number[];
    const all = logs.filter((l) => l.m?.[sel] != null).map((l) => l.m[sel]!) as number[];
    return mode(older.length >= 3 ? older : all);
  }, [logs, sel]);

  const hasRangeData = rangedLogs.some((l) => l.m?.[sel] != null);

  return (
    <div className="flex min-h-[210px] flex-col justify-center">
      {hasRangeData ? (
        <LineChart logs={rangedLogs} metricKey={sel} options={metric.options} base={base} />
      ) : (
        <p className="py-16 text-center text-sm text-ink-soft">
          Brak zapisów w tym zakresie. Wybierz dłuższy okres.
        </p>
      )}
    </div>
  );
}

/* --- modal ze szczegółami pojedynczego dnia --- */
function NoteDetail({ log, onClose }: { log: DayLog; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Notatka — ${fmtLong(log.date)}`}
      onClick={onClose}
    >
      <div
        className="sketch-box max-h-[85vh] w-full max-w-[480px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg first-letter:uppercase">{fmtLong(log.date)}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Zamknij" className="-mr-1 shrink-0 p-1">
            <Icon name="close" size={22} />
          </Button>
        </div>

        {log.note && stripHtml(log.note).length > 0 ? (
          <div
            className="tiptap mb-4 text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: log.note }}
          />
        ) : (
          <p className="mb-4 text-sm text-ink-soft">Brak treści notatki tego dnia.</p>
        )}

        {/* odhaczone wskaźniki tego dnia */}
        <div className="flex flex-col gap-2 border-t border-hairline pt-3">
          {METRICS.map((mt) => (
            <div key={mt.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-ink-soft">
                <Icon name={mt.icon} size={16} />
                {mt.label}
              </span>
              <span className="font-mono font-medium">{optLabel(mt.key, log.m?.[mt.key])}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Stats() {
  const { logs } = useCat();
  const [idx, setIdx] = useState(0);
  const [range, setRange] = useState<number>(30);
  const [noteOrder, setNoteOrder] = useState<"desc" | "asc">("desc");
  const [openDate, setOpenDate] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIdx((prev) => (prev !== i ? i : prev));
  };

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(METRICS.length - 1, i));
    if (clamped === idx) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIdx(clamped);
  };

  const notes = useMemo(
    () =>
      [...logs]
        .filter((l) => l.note && stripHtml(l.note).length > 0)
        .sort((a, b) => {
          const cmp = a.date < b.date ? -1 : 1;
          return noteOrder === "desc" ? -cmp : cmp;
        }),
    [logs, noteOrder],
  );

  const openLog = openDate ? logs.find((l) => l.date === openDate) ?? null : null;

  if (logs.length === 0) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        <h2 className="text-xl">Brak danych</h2>
        <p className="text-sm text-ink-soft">
          Zacznij od zakładki „Dziś". Po kilku dniach pojawi się tu przebieg każdego
          wskaźnika.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* slider wskaźników: duże strzałki, aktywny na środku, reszta po bokach */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(idx - 1)}
          disabled={idx === 0}
          aria-label="Poprzedni wskaźnik"
          className="shrink-0 px-0.5 text-ink transition hover:-translate-x-0.5 disabled:opacity-20"
        >
          <Icon name="arrowRight" size={28} strokeWidth={2.4} className="rotate-180" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
          {METRICS.map((m, i) => {
            const isActive = i === idx;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => goTo(i)}
                aria-label={m.label}
                aria-current={isActive}
                className={cn(
                  "flex shrink-0 items-center transition-colors duration-300",
                  isActive ? "text-ink" : "text-ink-faint hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "transition-transform duration-300 ease-out",
                    isActive ? "scale-110" : "scale-100",
                  )}
                >
                  <Icon name={m.icon} size={24} />
                </span>
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap font-hand text-lg font-semibold transition-all duration-300 ease-out",
                    isActive ? "ml-1.5 max-w-[160px] opacity-100" : "ml-0 max-w-0 opacity-0",
                  )}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => goTo(idx + 1)}
          disabled={idx === METRICS.length - 1}
          aria-label="Następny wskaźnik"
          className="shrink-0 px-0.5 text-ink transition hover:translate-x-0.5 disabled:opacity-20"
        >
          <Icon name="arrowRight" size={28} strokeWidth={2.4} />
        </button>
      </div>

      {/* zakres czasu */}
      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <ToggleChip
            key={r.l}
            selected={range === r.d}
            onClick={() => setRange(r.d)}
            className="min-h-[32px] px-3 py-1 text-xs"
          >
            {r.l}
          </ToggleChip>
        ))}
      </div>

      {/* karuzela wykresów — swipe lewo/prawo, bez ramki */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {METRICS.map((m) => (
          <div key={m.key} className="w-full shrink-0 snap-start">
            <MetricPanel metric={m} logs={logs} range={range} />
          </div>
        ))}
      </div>

      {/* notatki */}
      <section className="sketch-box">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-xl">Notatki</h2>
          {notes.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setNoteOrder((o) => (o === "desc" ? "asc" : "desc"))}
              className="px-2 py-1 text-xs font-medium"
            >
              <Icon name="sort" size={16} />
              {noteOrder === "desc" ? "Od najnowszych" : "Od najstarszych"}
            </Button>
          )}
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-ink-soft">Brak notatek. Dodasz je w zakładce „Dziś".</p>
        ) : (
          <ul className="scroll-sketch m-0 flex max-h-[264px] list-none flex-col overflow-y-auto p-0 pr-2.5">
            {notes.map((l) => (
              <li key={l.date} className="border-t border-hairline first:border-t-0">
                <button
                  type="button"
                  onClick={() => setOpenDate(l.date)}
                  className="flex w-full items-center gap-3 py-2.5 text-left text-sm leading-normal transition-colors hover:text-ink active:opacity-70"
                >
                  <span className="min-w-[56px] shrink-0 font-semibold text-ink-faint">
                    {fmt(l.date)}
                  </span>
                  <span className="line-clamp-2 flex-1">{stripHtml(l.note!)}</span>
                  <Icon name="arrowRight" size={18} className="shrink-0 text-ink-faint" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {openLog && <NoteDetail log={openLog} onClose={() => setOpenDate(null)} />}
    </div>
  );
}
