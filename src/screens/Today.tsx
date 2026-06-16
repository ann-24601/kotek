"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { Squiggle, HandUnderline } from "@/components/Squiggle";
import { NoteEditor } from "@/components/NoteEditor";
import { PhotoThumbs, PhotoUploader } from "@/components/PhotoUploader";
import { removeDayPhoto } from "@/lib/photos";
import { useCat } from "@/context/CatContext";
import { useAuth } from "@/context/AuthContext";
import { METRICS } from "@/lib/constants";
import { rankTips } from "@/lib/tips";
import { todayStr, fmtLong } from "@/lib/dates";
import type { DayLog, DayMetrics } from "@/lib/types";

export function Today() {
  const { profile, logs, saveLogs } = useCat();
  const { user } = useAuth();

  const today = todayStr();
  const existing = logs.find((l) => l.date === today);

  // porady dopasowane do statystyk zachowań kota; kliknięcie pokazuje kolejną
  const tips = useMemo(() => rankTips(logs), [logs]);
  const [tipIdx, setTipIdx] = useState(0);
  const tip = tips[tipIdx % tips.length]?.text ?? "";
  const nextTip = () => setTipIdx((i) => i + 1);

  const normals = useMemo<DayMetrics>(
    () => Object.fromEntries(METRICS.map((x) => [x.key, x.normal])) as DayMetrics,
    [],
  );

  const [m, setM] = useState<DayMetrics>(
    existing?.m && Object.keys(existing.m).length ? existing.m : normals,
  );
  const [note, setNote] = useState(existing?.note ?? "");
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [saved, setSaved] = useState(false);

  const setMetric = (k: keyof DayMetrics, v: number) => {
    setM((s) => ({ ...s, [k]: v }));
    setSaved(false);
  };

  const addPhotos = (paths: string[]) => {
    setPhotos((p) => [...p, ...paths]);
    setSaved(false);
  };

  const removePhoto = (path: string) => {
    setPhotos((p) => p.filter((x) => x !== path));
    setSaved(false);
    void removeDayPhoto(path).catch((err) =>
      console.error("Usunięcie zdjęcia nie powiodło się:", err),
    );
  };

  const save = () => {
    const entry: DayLog = { date: today, m, note, photos };
    saveLogs([...logs.filter((l) => l.date !== today), entry]);
    setSaved(true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* data */}
      <span className="tag self-start">dziś · {fmtLong(today)}</span>

      {/* hasło o kotku */}
      <header className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] leading-tight">Cześć! Jak tam {profile?.name}?</h1>
        <HandUnderline width={150} />
        {/* porada w „dymku" z krzywą krawędzią */}
        <button
          type="button"
          onClick={nextTip}
          title="Kliknij, aby zobaczyć kolejną poradę"
          aria-label="Pokaż kolejną poradę"
          className="ink-edge ink-edge--soft group mt-1 max-w-[54ch] cursor-pointer select-none rounded-[var(--r-box-2)] bg-paper-2 px-4 py-3 text-left text-[14px] leading-snug text-ink-soft transition hover:text-ink focus-visible:outline-none"
        >
          <span className="mb-1 flex items-center gap-1.5 font-hand text-xs font-bold text-ink">
            <Icon name="sparkle" size={15} />
            porada dnia
          </span>
          {tip}
          <span className="ml-1 inline-flex items-center gap-1 whitespace-nowrap text-[12px] text-ink-faint opacity-70 transition group-hover:opacity-100">
            <Icon name="refresh" size={14} />
            kolejna
          </span>
        </button>
      </header>

      {/* zapis dnia (płasko, bez ramki) */}
      <section className="mt-3">
        {/* odhaczanie pól — sekcje rozdzielone krzywą linią */}
        {METRICS.map((mt, i) => (
          <fieldset key={mt.key} className="min-w-0 border-0 p-0 [&:not(:first-child)]:mt-5">
            {i > 0 && <Squiggle className="mb-5" />}
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

        {/* zdjęcia dnia — nad treścią wpisu */}
        {photos.length > 0 && (
          <div className="mt-6">
            <PhotoThumbs photos={photos} onRemove={removePhoto} />
          </div>
        )}

        {/* notatka / wpis dnia — edytor z paskiem formatowania (Markdown) */}
        <fieldset className="mt-5 min-w-0 border-0 p-0">
          <Squiggle className="mb-5" />
          <legend className="mb-2 flex items-center gap-2 p-0 font-hand text-lg font-semibold">
            <Icon name="note" size={28} />
            Notatka
          </legend>
          <NoteEditor
            value={note}
            onChange={(html) => {
              setNote(html);
              setSaved(false);
            }}
            placeholder=""
            ariaLabel="Co dziś zwróciło Twoją uwagę?"
          />
        </fieldset>

        {/* dodawanie zdjęć — na samym dole karty */}
        {user && (
          <div className="mt-5">
            <PhotoUploader userId={user.id} date={today} onAdd={addPhotos} />
          </div>
        )}

        {/* CTA — przyklejone na dole, zawsze pod ręką */}
        <div className="sticky bottom-2 z-20 mt-7 pb-1 pt-4">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-full h-8 bg-gradient-to-t from-paper to-transparent"
            aria-hidden="true"
          />
          <Button block size="lg" onClick={save}>
            <Icon name="check" size={22} />
            {saved ? "Zapisano ✓" : "Zapisz dzień"}
          </Button>
        </div>
      </section>
    </div>
  );
}
