"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { NoteEditor } from "@/components/NoteEditor";
import { useCat } from "@/context/CatContext";
import { METRICS, PILLARS } from "@/lib/constants";
import { todayStr, fmtLong } from "@/lib/dates";
import type { DayLog, DayMetrics } from "@/lib/types";

/* --- pula porad (hasło o kotku) ---
   Faza 1: losowane. Porady o zabawie + tematy środowiskowe (dawne „filary”)
   pokazują się wymiennie jako jeden tekst pod nagłówkiem.
   Faza 2: dopasowanie do notatek, logowanej aktywności i statystyk. */
const PLAY_TIPS = [
  "Zakończ każdą sesję złapaniem zdobyczy, a zaraz potem posiłkiem — to domyka instynkt łowiecki.",
  "Zacznij od wodzenia wzrokiem: powoli przeciągaj zabawkę w pewnej odległości. Samo śledzenie oczami to już pierwszy etap polowania.",
  "Krótkie sesje z dystansu, nigdy nie machaj przy pysku. Pozwól obserwować i podejść samemu — wtedy poczuje się łowcą, nie ofiarą.",
  "Przeciągaj zabawkę po podłodze i chowaj ją za meble. Koty polujące przy ziemi lubią, gdy „ofiara” ucieka i znika.",
  "Unoś zabawkę, rób skoki i krótkie pauzy w powietrzu. Dla łowcy powietrznego to cel do namierzenia i ataku.",
  "Pozwól „złapać” zdobycz co kilka prób — niedokończona sekwencja frustruje. Zakończ sesję sukcesem, a potem posiłkiem.",
];

export function Today() {
  const { profile, logs, saveLogs } = useCat();

  const today = todayStr();
  const existing = logs.find((l) => l.date === today);
  // losowa porada z puli: zabawa + środowisko
  const tip = useMemo(() => {
    const pool = [...PLAY_TIPS, ...PILLARS.map((p) => p.d)];
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const normals = useMemo<DayMetrics>(
    () => Object.fromEntries(METRICS.map((x) => [x.key, x.normal])) as DayMetrics,
    [],
  );

  const [m, setM] = useState<DayMetrics>(
    existing?.m && Object.keys(existing.m).length ? existing.m : normals,
  );
  const [note, setNote] = useState(existing?.note ?? "");
  const [saved, setSaved] = useState(false);

  const setMetric = (k: keyof DayMetrics, v: number) => {
    setM((s) => ({ ...s, [k]: v }));
    setSaved(false);
  };

  const save = () => {
    const entry: DayLog = { date: today, m, note };
    saveLogs([...logs.filter((l) => l.date !== today), entry]);
    setSaved(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* data */}
      <span className="tag self-start">dziś · {fmtLong(today)}</span>

      {/* hasło o kotku */}
      <header className="flex flex-col gap-2.5">
        <h1 className="text-[1.75rem] leading-tight">Cześć! Jak tam {profile?.name}?</h1>
        <p className="max-w-[52ch] text-[14px] leading-snug text-ink-soft">{tip}</p>
      </header>

      {/* zapis dnia (płasko, bez ramki) */}
      <section className="mt-3">
        {/* notatka / wpis dnia — edytor z paskiem formatowania (Markdown) */}
        <NoteEditor
          value={note}
          onChange={(html) => {
            setNote(html);
            setSaved(false);
          }}
          placeholder=""
          ariaLabel="Co dziś zwróciło Twoją uwagę?"
        />

        {/* odhaczanie pól */}
        {METRICS.map((mt) => (
          <fieldset key={mt.key} className="mt-6 min-w-0 border-0 p-0">
            <legend className="mb-2 flex items-center gap-2 p-0 font-hand text-lg font-semibold">
              <Icon name={mt.icon} size={28} />
              {mt.label}
            </legend>
            <div className="flex flex-wrap gap-2">
              {mt.options.map((o) => (
                <ToggleChip
                  key={o.v}
                  selected={m[mt.key] === o.v}
                  tone={mt.red?.includes(o.v) ? "danger" : "default"}
                  onClick={() => setMetric(mt.key, o.v)}
                >
                  {o.l}
                </ToggleChip>
              ))}
            </div>
          </fieldset>
        ))}

        <Button block size="lg" onClick={save} className="mt-5">
          <Icon name="check" size={22} />
          {saved ? "Zapisano ✓" : "Zapisz dzień"}
        </Button>
      </section>
    </div>
  );
}
