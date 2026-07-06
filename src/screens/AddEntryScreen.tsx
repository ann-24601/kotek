"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { LabeledSlider } from "@/components/ui/labeled-slider";
import { Squiggle } from "@/components/Squiggle";
import { Art } from "@/components/Illustration";
import { NoteEditor } from "@/components/NoteEditor";
import { PhotoThumbs, PhotoUploader } from "@/components/PhotoUploader";
import { removeDayPhoto } from "@/lib/photos";
import { useCat } from "@/context/CatContext";
import { useAuth } from "@/context/AuthContext";
import { METRICS } from "@/lib/constants";
import { todayStr } from "@/lib/dates";
import type { DayLog, DayMetrics } from "@/lib/types";

interface ChipOption {
  v: string;
  l: string;
}

/* --- konfiguracja pól szczegółowych dla trzech metryk (poza slajderem) --- */
const REASON_OPTS: ChipOption[] = [
  { v: "jedzenie", l: "Jedzenie" },
  { v: "uwaga", l: "Uwaga" },
  { v: "nuda", l: "Nuda" },
  { v: "zamkniete_drzwi", l: "Zamknięte drzwi" },
  { v: "nie_wiem", l: "Nie wiem" },
];
const REACTION_OPTS: ChipOption[] = [
  { v: "nakarmienie", l: "Nakarmienie" },
  { v: "zabawa", l: "Zabawa" },
  { v: "glaskanie", l: "Głaskanie" },
  { v: "zignorowanie", l: "Zignorowanie" },
  { v: "mowienie", l: "Mówienie do kotka" },
];
const CZAS_OPTS: ChipOption[] = [
  { v: "2min", l: "2 min" },
  { v: "5min", l: "5 min" },
  { v: "10min", l: "10 min" },
  { v: "10plus", l: ">10 min" },
];
const ZABAWKA_OPTS: ChipOption[] = [
  { v: "wedka", l: "Wędka" },
  { v: "laser", l: "Laser" },
  { v: "sznurek", l: "Sznurek" },
  { v: "tunel", l: "Tunel" },
  { v: "koc", l: "Koc/dywan" },
  { v: "myszka", l: "Myszka" },
  { v: "inna", l: "Inna" },
];
const ZLAPAL_OPTS: ChipOption[] = [
  { v: "tak", l: "Tak" },
  { v: "nie", l: "Nie" },
  { v: "lapal_wypuszczal", l: "Łapał i wypuszczał" },
];
const OD_KIEDY_OPTS: ChipOption[] = [
  { v: "dzisiaj", l: "Dzisiaj" },
  { v: "kilka_dni", l: "Kilka dni" },
  { v: "tydzien_plus", l: "> tygodnia" },
];

type Values = Record<string, string | string[]>;

/* --- grupa chipów jednego pola --- */
function ChipField({
  label,
  options,
  multi,
  values,
  fieldKey,
  onChange,
}: {
  label: string;
  options: ChipOption[];
  multi?: boolean;
  values: Values;
  fieldKey: string;
  onChange: (key: string, v: string | string[]) => void;
}) {
  const cur = values[fieldKey];
  const isSel = (v: string) => (Array.isArray(cur) ? cur.includes(v) : cur === v);
  const toggle = (v: string) => {
    if (multi) {
      const arr = Array.isArray(cur) ? cur : [];
      onChange(fieldKey, arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else {
      onChange(fieldKey, cur === v ? "" : v);
    }
  };

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="mb-2 p-0 font-hand text-base font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <ToggleChip key={o.v} selected={isSel(o.v)} onClick={() => toggle(o.v)}>
            {o.l}
          </ToggleChip>
        ))}
      </div>
    </fieldset>
  );
}

/* --- składa strukturalną linię notatki z wybranych chipów sekcji --- */
function composeLine(sectionLabel: string, groups: { label: string; options: ChipOption[]; values: Values; key: string }[]): string {
  const parts: string[] = [];
  for (const g of groups) {
    const v = g.values[g.key];
    if (v == null || (Array.isArray(v) && v.length === 0) || v === "") continue;
    const labels = Array.isArray(v)
      ? v.map((x) => g.options.find((o) => o.v === x)?.l ?? x).join(", ")
      : g.options.find((o) => o.v === v)?.l ?? v;
    parts.push(`${g.label.replace(/[?:]/g, "").trim()}: ${labels}`);
  }
  if (parts.length === 0) return "";
  return `<p><strong>${sectionLabel}</strong> · ${parts.join(" · ")}</p>`;
}

function appendNote(existing: string | undefined, line: string): string {
  const cur = (existing ?? "").trim();
  if (!line) return cur;
  return cur ? `${cur}${line}` : line;
}

export function AddEntryScreen() {
  const router = useRouter();
  const { logs, saveLogs } = useCat();
  const { user } = useAuth();
  const today = todayStr();
  const existing = logs.find((l) => l.date === today);

  const normal: DayMetrics = Object.fromEntries(METRICS.map((m) => [m.key, m.normal])) as DayMetrics;
  const vocalMetric = METRICS.find((m) => m.key === "vocal")!;
  const zabawaMetric = METRICS.find((m) => m.key === "zabawa")!;
  const apetytMetric = METRICS.find((m) => m.key === "apetyt")!;

  const [vocal, setVocal] = useState(existing?.m?.vocal ?? normal.vocal ?? 0);
  const [zabawa, setZabawa] = useState(existing?.m?.zabawa ?? normal.zabawa ?? 0);
  const [apetyt, setApetyt] = useState(existing?.m?.apetyt ?? normal.apetyt ?? 0);
  const [values, setValues] = useState<Values>({});
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [confirmClose, setConfirmClose] = useState(false);

  const setField = (key: string, v: string | string[]) => setValues((s) => ({ ...s, [key]: v }));

  const dirty =
    vocal !== (existing?.m?.vocal ?? normal.vocal) ||
    zabawa !== (existing?.m?.zabawa ?? normal.zabawa) ||
    apetyt !== (existing?.m?.apetyt ?? normal.apetyt) ||
    Object.keys(values).length > 0 ||
    note.trim().length > 0 ||
    photos.length > 0;

  const removePhoto = (path: string) => {
    setPhotos((p) => p.filter((x) => x !== path));
    void removeDayPhoto(path).catch(() => {});
  };

  const requestClose = () => {
    if (dirty) setConfirmClose(true);
    else router.back();
  };

  const save = () => {
    let entry: DayLog = existing
      ? { ...existing, m: { ...existing.m, vocal, zabawa, apetyt } }
      : { date: today, m: { vocal, zabawa, apetyt }, note: "", photos: [] };

    const lines = [
      composeLine("Miauczenie", [
        { label: "Powód", options: REASON_OPTS, values, key: "vocal_powod" },
        { label: "Twoja reakcja", options: REACTION_OPTS, values, key: "vocal_reakcja" },
      ]),
      composeLine("Zabawa", [
        { label: "Czas", options: CZAS_OPTS, values, key: "zabawa_czas" },
        { label: "Zabawka", options: ZABAWKA_OPTS, values, key: "zabawa_zabawka" },
        { label: "Czy złapał zabawkę?", options: ZLAPAL_OPTS, values, key: "zabawa_zlapal" },
      ]),
      composeLine("Apetyt", [
        { label: "Od kiedy", options: OD_KIEDY_OPTS, values, key: "apetyt_od_kiedy" },
      ]),
    ].filter(Boolean);

    let combinedNote = entry.note ?? "";
    for (const line of lines) combinedNote = appendNote(combinedNote, line);
    if (note.trim()) combinedNote = appendNote(combinedNote, `<p>${note}</p>`);

    entry = { ...entry, note: combinedNote, photos: [...(entry.photos ?? []), ...photos] };
    saveLogs([...logs.filter((l) => l.date !== today), entry]);
    router.back();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      {/* nagłówek */}
      <div className="flex shrink-0 items-center gap-3 px-4 pt-[calc(16px+env(safe-area-inset-top,0px))]">
        <button
          type="button"
          onClick={requestClose}
          aria-label="Wstecz"
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center text-ink active:opacity-60"
        >
          <Icon name="arrowRight" size={22} className="rotate-180" />
        </button>
        <h2 className="text-xl">Dodaj nowy wpis</h2>
      </div>
      <Squiggle className="mt-3 shrink-0" />

      {/* treść */}
      <div className="scroll-sketch min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-[520px] flex-col gap-5">
          {/* ilustracja — kalendarz */}
          <div className="grid w-full place-items-center" aria-hidden="true">
            <Art name="kalendarz" fluid className="w-full max-w-[360px]" />
          </div>
          {/* Miauczenie */}
          <div className="flex flex-col gap-4">
            <h3 className="font-hand text-xl font-semibold">Miauczenie</h3>
            <LabeledSlider options={vocalMetric.options} value={vocal} onChange={setVocal} />
            <ChipField
              label="Co mogło być powodem?"
              options={REASON_OPTS}
              multi
              values={values}
              fieldKey="vocal_powod"
              onChange={setField}
            />
            <ChipField
              label="Twoja reakcja"
              options={REACTION_OPTS}
              multi
              values={values}
              fieldKey="vocal_reakcja"
              onChange={setField}
            />
          </div>

          <Squiggle />

          {/* Zabawa */}
          <div className="flex flex-col gap-4">
            <h3 className="font-hand text-xl font-semibold">Zabawa</h3>
            <LabeledSlider options={zabawaMetric.options} value={zabawa} onChange={setZabawa} />
            <ChipField
              label="Czas"
              options={CZAS_OPTS}
              values={values}
              fieldKey="zabawa_czas"
              onChange={setField}
            />
            <ChipField
              label="Zabawka"
              options={ZABAWKA_OPTS}
              multi
              values={values}
              fieldKey="zabawa_zabawka"
              onChange={setField}
            />
            <ChipField
              label="Czy kotek złapał zabawkę?"
              options={ZLAPAL_OPTS}
              values={values}
              fieldKey="zabawa_zlapal"
              onChange={setField}
            />
          </div>

          <Squiggle />

          {/* Apetyt */}
          <div className="flex flex-col gap-4">
            <h3 className="font-hand text-xl font-semibold">Apetyt</h3>
            <LabeledSlider options={apetytMetric.options} value={apetyt} onChange={setApetyt} />
            <ChipField
              label="Od kiedy jest mniejszy/większy?"
              options={OD_KIEDY_OPTS}
              values={values}
              fieldKey="apetyt_od_kiedy"
              onChange={setField}
            />
          </div>

          <Squiggle />

          {/* Notatka / zdjęcie */}
          <div className="flex flex-col gap-4">
            <h3 className="font-hand text-xl font-semibold">Czy wydarzyło się coś jeszcze?</h3>
            <NoteEditor value={note} onChange={setNote} placeholder="" ariaLabel="Dodatkowa notatka" />
            {photos.length > 0 && <PhotoThumbs photos={photos} onRemove={removePhoto} />}
            {user && (
              <PhotoUploader userId={user.id} date={today} onAdd={(p) => setPhotos((c) => [...c, ...p])} />
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="shrink-0 px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-2">
        <div className="mx-auto max-w-[520px]">
          <Button block size="lg" onClick={save}>
            <Icon name="check" size={22} />
            Zapisz wpis
          </Button>
        </div>
      </div>

      {/* potwierdzenie zamknięcia bez zapisu */}
      {confirmClose && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmClose(false)}
        >
          <div
            className="ink-edge ink-edge--soft w-full max-w-[360px] rounded-[var(--r-box-2)] bg-paper p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-hand text-lg font-semibold">Na pewno chcesz nie zapisać wpisu?</p>
            <p className="mt-1 text-sm text-ink-faint">Wprowadzone zmiany zostaną utracone.</p>
            <div className="mt-4 flex gap-2.5">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmClose(false)}>
                Wróć do edycji
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => router.back()}>
                Nie zapisuj
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
