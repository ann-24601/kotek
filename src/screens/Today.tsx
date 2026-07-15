"use client";

import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { RoughBorder } from "@/components/RoughBorder";
import { Art, type ArtName } from "@/components/Illustration";
import { useCat } from "@/context/CatContext";
import { METRICS, MIN_DAYS, WIN, type Metric } from "@/lib/constants";
import { genitiveCatName } from "@/lib/polish";
import { rankTips, TIPS } from "@/lib/tips";
import { computeSignals } from "@/lib/signals";
import { routineIndex, precedersOfVocal } from "@/lib/routine";
import { todayStr, fmt, fmtLong, daysAgo } from "@/lib/dates";
import type { DayLog, DayMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------
   Wykres jednego wskaźnika — odręczny, z osiami jak w szkicu
   (Y = etykiety opcji metryki, X = daty).
   -------------------------------------------------------------- */
const CHART_RANGES = [7, 30, 90] as const;
/* przerwa dłuższa niż tyle dni = brak danych → linia się urywa,
   zamiast sugerować ciągły przebieg między odległymi wpisami */
const GAP_DAYS = 7;

/* gładka linia (Catmull-Rom → Bézier) z przycięciem, by nie wychodziła poza
   obszar wykresu — łagodniejsza i czytelniejsza niż ostry zygzak */
function smoothPath(pts: { x: number; y: number }[], yMin: number, yMax: number): string {
  if (pts.length < 2) return "";
  const clamp = (v: number) => Math.max(yMin, Math.min(yMax, v));
  const t = 0.16;
  const d = [`M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = clamp(p1.y + (p2.y - p0.y) * t);
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = clamp(p2.y - (p3.y - p1.y) * t);
    d.push(`C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`);
  }
  return d.join(" ");
}

function MetricChart({ logs, metric, days }: { logs: DayLog[]; metric: Metric; days: number }) {
  const W = 340;
  const H = 210;
  const padL = 48;
  const padR = 4;
  const padT = 22;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxV = Math.max(...metric.options.map((o) => o.v)) || 1;

  const from = daysAgo(days);
  const rangeStart = new Date(from).getTime();
  const rangeEnd = new Date(todayStr()).getTime();
  const rangeMs = Math.max(1, rangeEnd - rangeStart);

  const pts = useMemo(
    () =>
      logs
        .filter((l) => l.date >= from && l.m?.[metric.key] != null)
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .map((l) => ({ date: l.date, v: l.m![metric.key]! })),
    [logs, metric.key, from],
  );

  // pozycja na osi X wg rzeczywistej daty (nie indeksu wpisu) — dzięki temu
  // przerwy między wpisami odpowiadają rzeczywistemu upływowi czasu.
  const x = (date: string) => padL + ((new Date(date).getTime() - rangeStart) / rangeMs) * plotW;
  const y = (v: number) => padT + (1 - v / maxV) * plotH;

  // linia urywa się przy przerwach > GAP_DAYS — osobny segment na każdą serię dni z danymi
  const segments = useMemo(() => {
    const gapMs = GAP_DAYS * 24 * 60 * 60 * 1000;
    const out: { x: number; y: number }[][] = [];
    let cur: { x: number; y: number }[] = [];
    let prevT: number | null = null;
    for (const p of pts) {
      const t = new Date(p.date).getTime();
      if (prevT != null && t - prevT > gapMs && cur.length > 0) {
        out.push(cur);
        cur = [];
      }
      cur.push({ x: x(p.date), y: y(p.v) });
      prevT = t;
    }
    if (cur.length > 0) out.push(cur);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pts, rangeStart, rangeMs, maxV]);

  const dotR = pts.length > 45 ? 2.4 : 3.2;
  const labelStyle = { fill: "var(--ink-soft)", fontFamily: "var(--font-mono)", fontSize: 8 } as const;
  const midDate = new Date(rangeStart + rangeMs / 2).toISOString().slice(0, 10);
  const xTickDates = [from, midDate, todayStr()];

  if (pts.length < 2) {
    return (
      <p className="py-14 text-center text-sm text-ink-soft">
        Za mało danych na wykres w tym zakresie — dodaj kilka wpisów.
      </p>
    );
  }

  return (
    <svg className="block h-auto w-full" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Wykres: ${metric.label}`}>
      {metric.options.map((o) => (
        <line
          key={o.v}
          x1={0}
          x2={W}
          y1={y(o.v)}
          y2={y(o.v)}
          stroke="var(--dot)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ))}
      {metric.options.map((o) => (
        <text key={o.v} x={2} y={y(o.v) - 6} style={labelStyle} textAnchor="start">
          {o.l.length > 14 ? o.l.slice(0, 13) + "…" : o.l}
        </text>
      ))}
      {segments.map((seg, i) =>
        seg.length >= 2 ? (
          <path
            key={i}
            d={smoothPath(seg, padT, padT + plotH)}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={2.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="rough-line"
          />
        ) : null,
      )}
      {pts.map((p) => (
        <circle key={p.date} cx={x(p.date)} cy={y(p.v)} r={dotR} fill="var(--ink)" />
      ))}
      {xTickDates.map((d, i) => (
        <text
          key={d}
          x={x(d)}
          y={H - 8}
          style={labelStyle}
          textAnchor={i === 0 ? "start" : i === xTickDates.length - 1 ? "end" : "middle"}
        >
          {fmt(d)}
        </text>
      ))}
    </svg>
  );
}

/* --------------------------------------------------------------
   Rząd „dots" — selektor metryki (aktywna = wypełniona, reszta
   przerywana), z podpisem pod spodem. Steruje wykresem.
   -------------------------------------------------------------- */
function mode(arr: number[]): number | null {
  if (!arr.length) return null;
  const c: Record<number, number> = {};
  arr.forEach((v) => (c[v] = (c[v] || 0) + 1));
  return +Object.keys(c).reduce((a, b) => (c[+b] > c[+a] ? b : a));
}

function MetricDots({
  logs,
  selected,
  onSelect,
}: {
  logs: DayLog[];
  selected: keyof DayMetrics;
  onSelect: (k: keyof DayMetrics) => void;
}) {
  return (
    <div className="flex justify-between gap-2">
      {METRICS.map((m) => {
        const isSel = m.key === selected;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onSelect(m.key)}
            className="flex flex-1 flex-col items-center gap-2"
            aria-pressed={isSel}
          >
            <span
              className={cn(
                "flex aspect-square w-full max-w-[64px] items-center justify-center rounded-full",
                isSel ? "bg-ink text-paper" : "border-2 border-dashed border-ink-faint text-ink",
              )}
            >
              <Icon name={m.icon} size={24} />
            </span>
            <span className={cn("font-hand text-[13px] font-semibold leading-tight", !isSel && "text-ink-soft")}>
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------
   Karuzela „Wglądy" — karty z ilustracją + podpisami (jak szkic).
   -------------------------------------------------------------- */
interface Insight {
  art: ArtName;
  title: string;
  subtitle: string;
}

function InsightCarousel({ items, title }: { items: Insight[]; title: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  // wygaszenie prawej krawędzi: kolejna karta wystaje zza ekranu celowo,
  // ale twarde cięcie tekstu w pół słowa wygląda jak błąd — fade to sygnalizuje
  const [atEnd, setAtEnd] = useState(false);
  const onTrackScroll = () => {
    const el = trackRef.current;
    if (el) setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  };
  const scrollBy = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl">{title}</h2>
        {/* strzałki — na desktopie karuzela nie sugeruje, że można przewijać */}
        <div className="hidden gap-1.5 lg:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Przewiń porady w lewo"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-dashed border-ink text-ink hover:bg-ink hover:text-paper"
          >
            <Icon name="arrowRight" size={16} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Przewiń porady w prawo"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-dashed border-ink text-ink hover:bg-ink hover:text-paper"
          >
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </div>
      {/* p-1/-m-1: falująca obwódka kafelka wystaje ~4px poza jego pudełko,
          a overflow-x-auto przycina też w pionie — padding daje linii miejsce */}
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          className="no-scrollbar -m-1 flex snap-x snap-mandatory gap-3 overflow-x-auto p-1"
        >
          {items.map((it, i) => (
            <article key={i} className="flex w-[78%] shrink-0 snap-start flex-col sm:w-[46%]">
              {/* obraz wypełnia kafelek; ramka NAD obrazem — nieprzezroczyste (białe)
                  tło PNG zakrywałoby linię wszędzie, gdzie fala wygina się do środka */}
              <div className="relative h-[180px] w-full rounded-[18px] bg-paper">
                <Art name={it.art} fluid className="h-full w-full object-contain" />
                <RoughBorder radius={18} />
              </div>
              <h3 className="mt-2.5 font-hand text-lg font-semibold leading-tight">{it.title}</h3>
              <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{it.subtitle}</p>
            </article>
          ))}
        </div>
        {/* fade nad ucinaną kartą — znika po dojechaniu do końca */}
        {!atEnd && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 bottom-0 top-0 w-20 bg-gradient-to-l from-paper from-25% via-paper/75 to-transparent"
          />
        )}
      </div>
    </div>
  );
}

/* --- pomocnicze do spersonalizowanych wglądów --- */
function tipById(id: string): string {
  return TIPS.find((t) => t.id === id)?.text ?? "";
}

function metricMode(logs: DayLog[], key: keyof DayMetrics, days = WIN): number | null {
  const from = daysAgo(days);
  const vals = logs
    .filter((l) => l.date >= from)
    .map((l) => l.m?.[key])
    .filter((v): v is number => v != null);
  return mode(vals);
}

function routineInsight(routine: ReturnType<typeof routineIndex>): Insight {
  return {
    art: "relaks",
    title: routine.pct != null ? `Rutyna ${routine.pct}%` : "Rutyna dnia",
    subtitle: routine.mostStable
      ? `Najstabilniejsze: ${routine.mostStable.label.toLowerCase()}. ${tipById("ritual-predictable")}`
      : tipById("ritual-crepuscular"),
  };
}

function playInsight(logs: DayLog[]): Insight {
  const zab = metricMode(logs, "zabawa");
  const text =
    zab == null ? tipById("play-sequence") : zab <= 1 ? tipById("play-short-sessions") : tipById("play-end-catch");
  return { art: "zabawa-logiczna", title: "Zabawa i polowanie", subtitle: text };
}

function feedingInsight(logs: DayLog[], preced: ReturnType<typeof precedersOfVocal>): Insight {
  if (preced.preceders.length > 0) {
    const p = preced.preceders[0];
    return {
      art: "jedzenie",
      title: "Jak karmić",
      subtitle: `Przed miauczeniem najczęściej: ${p.label.toLowerCase()} (${p.count}×). ${tipById("begging-fixed-times")}`,
    };
  }
  const vocal = metricMode(logs, "vocal");
  const text =
    vocal != null && vocal >= 2 ? tipById("begging-reward-quiet") : tipById("ritual-play-then-feed");
  return { art: "jedzenie", title: "Jak karmić", subtitle: text };
}

function watchInsight(signals: ReturnType<typeof computeSignals>): Insight {
  if (signals.ready && signals.sigs.length > 0) {
    return { art: "karty", title: "Warto obserwować", subtitle: `${signals.sigs[0].label}: ${signals.sigs[0].text}` };
  }
  return { art: "behawiorysta", title: "5 filarów środowiska", subtitle: tipById("env-hideouts") };
}

export function Today() {
  const { profile, logs } = useCat();
  const today = todayStr();
  const existing = logs.find((l) => l.date === today);
  const name = genitiveCatName(profile?.name ?? "kota");

  const tips = useMemo(() => rankTips(logs), [logs]);
  const [tipIdx, setTipIdx] = useState(0);
  const tipObj = tips[tipIdx % tips.length];
  const tip = tipObj?.text ?? "";
  // porady „do weterynarza" to inna waga niż wskazówki o zabawie — wyróżnij
  const tipUrgent = tipObj?.tags?.includes("vet") ?? false;

  const signals = useMemo(() => computeSignals(logs), [logs]);
  const routine = useMemo(() => routineIndex(logs), [logs]);
  const preced = useMemo(() => precedersOfVocal(logs), [logs]);

  const [sel, setSel] = useState<keyof DayMetrics>("aktywnosc");
  const [chartDays, setChartDays] = useState<number>(30);
  const selMetric = METRICS.find((m) => m.key === sel)!;

  // 4 spersonalizowane wglądy do karuzeli: rutyna, zabawa, karmienie, obserwacja
  const insights = useMemo<Insight[]>(
    () => [routineInsight(routine), playInsight(logs), feedingInsight(logs, preced), watchInsight(signals)],
    [routine, preced, signals, logs],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* powitanie */}
      <header className="flex flex-col gap-1">
        <h1 className="text-[1.9rem] leading-tight">
          Cześć! Co słychać{" "}u{" "}
          {name}?
        </h1>
        {existing && Object.keys(existing.m).length ? (
          <p className="mt-1 text-sm text-ink-soft">Wpis na dziś już jest — {fmtLong(today)}.</p>
        ) : null}
      </header>

      {/* porada na dzisiaj — klik podmienia na kolejną */}
      <button
        type="button"
        onClick={() => setTipIdx((i) => i + 1)}
        aria-label="Pokaż kolejną poradę"
        className="group relative cursor-pointer select-none rounded-[18px] bg-paper px-4 py-3.5 text-left transition"
      >
        <RoughBorder radius={18} />
        <span className="mb-1.5 flex items-center justify-between gap-1.5">
          <span className="flex items-center gap-1.5 font-hand text-sm font-bold text-ink">
            <Icon name={tipUrgent ? "warn" : "refresh"} size={16} />
            {tipUrgent ? "Ważne — kiedy do weterynarza:" : "Porada na dzisiaj:"}
          </span>
          <span className="font-hand text-xs font-semibold text-ink-faint group-hover:text-ink">
            kolejna →
          </span>
        </span>
        <span className="block text-[14px] leading-snug text-ink-soft">{tip}</span>
      </button>

      {/* hero — dekoracja; na telefonie ustępuje miejsca statystykom */}
      <div className="hidden w-full place-items-center py-1 sm:grid">
        <Art name="karty-i-jedzenie" fluid className="w-full max-w-[400px]" />
      </div>

      {/* sekcja: przebieg wskaźników (dots selector + wykres) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl">Statystyki</h2>
          {/* przełącznik zakresu wykresu */}
          <div className="flex gap-1" role="group" aria-label="Zakres wykresu">
            {CHART_RANGES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setChartDays(d)}
                aria-pressed={chartDays === d}
                className={cn(
                  "min-h-8 rounded-full px-2.5 font-hand text-xs font-semibold",
                  chartDays === d
                    ? "bg-ink text-paper"
                    : "border-[1.5px] border-dashed border-ink-faint text-ink-soft",
                )}
              >
                {d} dni
              </button>
            ))}
          </div>
        </div>
        <MetricDots logs={logs} selected={sel} onSelect={setSel} />
        <MetricChart logs={logs} metric={selMetric} days={chartDays} />
        {/* krótki insight pod wykresem */}
        <p className="text-sm leading-snug text-ink-soft">
          {!signals.ready
            ? `Zbieram normę ${name}. Po ${MIN_DAYS} dniach zacznę wykrywać odchylenia (masz ${signals.have}).`
            : signals.sigs.length === 0
              ? "Wszystko w normie ostatnich dni — trzymaj rytuał."
              : `Warto obserwować: ${signals.sigs
                  .slice(0, 2)
                  .map((s) => `${s.label.toLowerCase()} (${s.text})`)
                  .join("; ")}.`}
        </p>
      </section>

      {/* karuzela wglądów */}
      <InsightCarousel items={insights} title={`Wskazówki dla ${name}`} />
    </div>
  );
}
