"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { Squiggle } from "@/components/Squiggle";
import { NoteEditor } from "@/components/NoteEditor";
import { PhotoThumbs, PhotoUploader } from "@/components/PhotoUploader";
import { removeDayPhoto } from "@/lib/photos";
import { useCat } from "@/context/CatContext";
import { useAuth } from "@/context/AuthContext";
import { METRICS } from "@/lib/constants";
import { todayStr, daysAgo, fmt, fmtLong } from "@/lib/dates";
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
const KIEDY_OPTS: ChipOption[] = [
  { v: "noc", l: "Noc / nad ranem" },
  { v: "przed_karmieniem", l: "Przed karmieniem" },
  { v: "po_powrocie", l: "Po Twoim powrocie" },
  { v: "caly_dzien", l: "Cały dzień" },
];
const ODMOWA_OPTS: ChipOption[] = [
  { v: "nie_probowalam", l: "Nie próbowałam/em" },
  { v: "patrzyl", l: "Patrzył, ale nie ruszył" },
  { v: "odpuscil", l: "Podszedł i odpuścił" },
  { v: "uciekl", l: "Uciekł / schował się" },
];
const POSILEK_OPTS: ChipOption[] = [
  { v: "tak", l: "Tak" },
  { v: "nie", l: "Nie" },
];
const INCYDENT_OPTS: ChipOption[] = [
  { v: "drapanie", l: "Drapanie mebli" },
  { v: "gryzienie", l: "Gryzienie" },
  { v: "kuweta", l: "Załatwianie poza kuwetą" },
  { v: "agresja", l: "Agresja / syczenie" },
  { v: "wymioty", l: "Wymioty" },
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

/* --- wartość metryki jako rząd chipów (zamiast suwaka): wszystkie opcje
   widoczne, jeden tap ustawia, tap w zaznaczony cofa do „brak obserwacji" --- */
function MetricChips({
  metricKey,
  value,
  onChange,
}: {
  metricKey: keyof DayMetrics;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const metric = METRICS.find((m) => m.key === metricKey)!;
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={metric.label}>
      {metric.options.map((o) => (
        <ToggleChip
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          selected={value === o.v}
          onClick={() => onChange(value === o.v ? null : o.v)}
        >
          {o.l}
        </ToggleChip>
      ))}
    </div>
  );
}

/* --- nagłówek sekcji metryki z jej ikoną --- */
function SectionHeading({ icon, children }: { icon: IconName; children: string }) {
  return (
    <h3 className="flex items-center gap-2.5 font-hand text-xl font-semibold">
      <Icon name={icon} size={22} />
      {children}
    </h3>
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

/* Usuwa z notatki wcześniej wygenerowane linie strukturalne, żeby ponowny zapis
   tego samego dnia nie doklejał duplikatów („Miauczenie · …" ×2). */
function stripComposedLines(note: string): string {
  return note.replace(/<p><strong>(Miauczenie|Zabawa|Apetyt|Incydenty)<\/strong> · .*?<\/p>/g, "");
}

/* wartości metryk dnia (null = nieustawiona) */
type MetricDraft = Record<keyof DayMetrics, number | null>;

function draftFromLog(log: DayLog | undefined): MetricDraft {
  return Object.fromEntries(
    METRICS.map((m) => [m.key, log?.m?.[m.key] ?? null]),
  ) as MetricDraft;
}

export function AddEntryScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { logs, saveLogs } = useCat();
  const { user } = useAuth();
  const today = todayStr();
  const yesterday = daysAgo(1);

  const paramDate = params.get("date");
  const initialDate = paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate) && paramDate <= today ? paramDate : today;
  const [date, setDate] = useState(initialDate);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const customDate = date !== today && date !== yesterday;
  const existing = logs.find((l) => l.date === date);

  const [draft, setDraft] = useState<MetricDraft>(() => draftFromLog(existing));
  const [values, setValues] = useState<Values>({});
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [confirmClose, setConfirmClose] = useState(false);
  const [saved, setSaved] = useState(false);

  // zmiana dnia = praca na wpisie innego dnia — wyzeruj szkic do stanu tego dnia
  useEffect(() => {
    setDraft(draftFromLog(logs.find((l) => l.date === date)));
    setValues({});
    setNote("");
    setPhotos([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const setMetric = (key: keyof DayMetrics, v: number | null) =>
    setDraft((s) => ({ ...s, [key]: v }));
  const setField = (key: string, v: string | string[]) => setValues((s) => ({ ...s, [key]: v }));

  // jeden tap: wszystkie metryki na normę tego kota — szybki wpis „bazowy"
  const setAllNormal = () =>
    setDraft(Object.fromEntries(METRICS.map((m) => [m.key, m.normal])) as MetricDraft);
  const allNormal = METRICS.every((m) => draft[m.key] === m.normal);

  /* progressive disclosure — pola szczegółowe tylko, gdy suwak coś sygnalizuje */
  const apetytNormal = METRICS.find((m) => m.key === "apetyt")!.normal;
  const showVocalDetails = draft.vocal != null && draft.vocal >= 1;
  const showPlayDetails = draft.zabawa != null && draft.zabawa >= 1;
  const showPlayRefusal = draft.zabawa === 0;
  const showApetytDetails = draft.apetyt != null && draft.apetyt !== apetytNormal;

  const dirty =
    METRICS.some((m) => draft[m.key] !== (existing?.m?.[m.key] ?? null)) ||
    Object.values(values).some((v) => (Array.isArray(v) ? v.length > 0 : v !== "")) ||
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
    // zapisujemy tylko ustawione metryki (null = brak obserwacji, nie zapisujemy nic)
    const m: DayMetrics = { ...(existing?.m ?? {}) };
    for (const mt of METRICS) {
      const v = draft[mt.key];
      if (v != null) m[mt.key] = v;
    }

    let entry: DayLog = existing
      ? { ...existing, m }
      : { date, m, note: "", photos: [] };

    // zapisujemy tylko pola z aktualnie widocznych sekcji — chipy zaznaczone,
    // zanim suwak schował sekcję, nie trafiają do notatki
    const lines = [
      composeLine(
        "Miauczenie",
        showVocalDetails
          ? [
              { label: "Kiedy", options: KIEDY_OPTS, values, key: "vocal_kiedy" },
              { label: "Powód", options: REASON_OPTS, values, key: "vocal_powod" },
              { label: "Twoja reakcja", options: REACTION_OPTS, values, key: "vocal_reakcja" },
            ]
          : [],
      ),
      composeLine(
        "Zabawa",
        showPlayDetails
          ? [
              { label: "Czas", options: CZAS_OPTS, values, key: "zabawa_czas" },
              { label: "Zabawka", options: ZABAWKA_OPTS, values, key: "zabawa_zabawka" },
              { label: "Czy złapał zabawkę?", options: ZLAPAL_OPTS, values, key: "zabawa_zlapal" },
              { label: "Posiłek po zabawie", options: POSILEK_OPTS, values, key: "zabawa_posilek" },
            ]
          : showPlayRefusal
            ? [{ label: "Dlaczego nie wyszło", options: ODMOWA_OPTS, values, key: "zabawa_odmowa" }]
            : [],
      ),
      composeLine(
        "Apetyt",
        showApetytDetails
          ? [{ label: "Od kiedy", options: OD_KIEDY_OPTS, values, key: "apetyt_od_kiedy" }]
          : [],
      ),
      composeLine("Incydenty", [
        { label: "Zaobserwowane", options: INCYDENT_OPTS, values, key: "incydenty" },
      ]),
    ].filter(Boolean);

    // nowe linie strukturalne ZASTĘPUJĄ stare (zamiast doklejać duplikaty)
    let combinedNote = lines.length > 0 ? stripComposedLines(entry.note ?? "") : entry.note ?? "";
    for (const line of lines) combinedNote = appendNote(combinedNote, line);
    if (note.trim()) combinedNote = appendNote(combinedNote, `<p>${note}</p>`);

    entry = { ...entry, note: combinedNote, photos: [...(entry.photos ?? []), ...photos] };
    saveLogs([...logs.filter((l) => l.date !== date), entry]);
    // krótkie potwierdzenie zapisu, potem powrót
    setSaved(true);
    setTimeout(() => router.back(), 700);
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
        <h2 className="text-xl">{existing ? "Edytuj wpis" : "Dodaj nowy wpis"}</h2>
      </div>
      <Squiggle className="mt-3 shrink-0" />

      {/* treść */}
      <div className="scroll-sketch min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-[520px] flex-col gap-5">
          {/* dzień, którego dotyczy wpis */}
          <div className="flex flex-col gap-2">
            <span id="wpis-data-label" className="font-hand text-base font-semibold">
              Który dzień?
            </span>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="wpis-data-label">
              <ToggleChip selected={date === today} onClick={() => setDate(today)}>
                Dziś
              </ToggleChip>
              <ToggleChip selected={date === yesterday} onClick={() => setDate(yesterday)}>
                Wczoraj
              </ToggleChip>
              <ToggleChip
                selected={customDate}
                onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                aria-label="Wybierz inną datę"
              >
                <Icon name="today" size={16} />
                {customDate ? fmt(date) : "Inna data"}
              </ToggleChip>
              <input
                ref={dateInputRef}
                id="wpis-data"
                type="date"
                value={date}
                max={today}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v && v <= today) setDate(v);
                }}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
            <p className="text-sm text-ink-soft first-letter:uppercase">
              {fmtLong(date)}
              {existing && <span className="text-ink-faint"> — ten dzień ma już wpis, edytujesz go.</span>}
            </p>
          </div>

          {/* szybki wpis: wszystko w normie jednym tapnięciem */}
          <Button variant="secondary" block onClick={setAllNormal} disabled={allNormal}>
            <Icon name="paw" size={18} />
            {allNormal ? "Wszystko w normie ✓" : "Dzień jak co dzień"}
          </Button>

          <Squiggle />

          {/* Aktywność */}
          <div className="flex flex-col gap-4">
            <SectionHeading icon="paw">Aktywność</SectionHeading>
            <MetricChips
              metricKey="aktywnosc"
              value={draft.aktywnosc}
              onChange={(v) => setMetric("aktywnosc", v)}
            />
          </div>

          <Squiggle />

          {/* Miauczenie */}
          <div className="flex flex-col gap-4">
            <SectionHeading icon="vocal">Miauczenie</SectionHeading>
            <MetricChips
              metricKey="vocal"
              value={draft.vocal}
              onChange={(v) => setMetric("vocal", v)}
            />
            {showVocalDetails && (
              <div className="chip-reveal flex flex-col gap-4">
                <ChipField
                  label="Kiedy miauczał?"
                  options={KIEDY_OPTS}
                  multi
                  values={values}
                  fieldKey="vocal_kiedy"
                  onChange={setField}
                />
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
            )}
          </div>

          <Squiggle />

          {/* Zabawa */}
          <div className="flex flex-col gap-4">
            <SectionHeading icon="feather">Zabawa</SectionHeading>
            <MetricChips
              metricKey="zabawa"
              value={draft.zabawa}
              onChange={(v) => setMetric("zabawa", v)}
            />
            {showPlayDetails && (
              <div className="chip-reveal flex flex-col gap-4">
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
                <ChipField
                  label="Czy po zabawie był posiłek?"
                  options={POSILEK_OPTS}
                  values={values}
                  fieldKey="zabawa_posilek"
                  onChange={setField}
                />
              </div>
            )}
            {showPlayRefusal && (
              <div className="chip-reveal">
                <ChipField
                  label="Dlaczego zabawa nie wyszła?"
                  options={ODMOWA_OPTS}
                  multi
                  values={values}
                  fieldKey="zabawa_odmowa"
                  onChange={setField}
                />
              </div>
            )}
          </div>

          <Squiggle />

          {/* Apetyt */}
          <div className="flex flex-col gap-4">
            <SectionHeading icon="bowl">Apetyt</SectionHeading>
            <MetricChips
              metricKey="apetyt"
              value={draft.apetyt}
              onChange={(v) => setMetric("apetyt", v)}
            />
            {showApetytDetails && (
              <div className="chip-reveal">
                <ChipField
                  label="Od kiedy jest mniejszy/większy?"
                  options={OD_KIEDY_OPTS}
                  values={values}
                  fieldKey="apetyt_od_kiedy"
                  onChange={setField}
                />
              </div>
            )}
          </div>

          <Squiggle />

          {/* Notatka / zdjęcie */}
          <div className="flex flex-col gap-4">
            <SectionHeading icon="note">Czy wydarzyło się coś jeszcze?</SectionHeading>
            <ChipField
              label="Incydenty (zaznacz, jeśli wystąpiły)"
              options={INCYDENT_OPTS}
              multi
              values={values}
              fieldKey="incydenty"
              onChange={setField}
            />
            <NoteEditor value={note} onChange={setNote} placeholder="" ariaLabel="Dodatkowa notatka" simple />
            {photos.length > 0 && <PhotoThumbs photos={photos} onRemove={removePhoto} />}
            {user && (
              <PhotoUploader userId={user.id} date={date} onAdd={(p) => setPhotos((c) => [...c, ...p])} />
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="shrink-0 px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-2">
        <div className="mx-auto max-w-[520px]">
          <Button block size="lg" onClick={save} disabled={!dirty || saved} aria-live="polite">
            <Icon name="check" size={22} />
            {saved ? "Zapisano ✓" : "Zapisz wpis"}
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
            <p className="font-hand text-lg font-semibold">Odrzucić niezapisany wpis?</p>
            <p className="mt-1 text-sm text-ink-faint">Wprowadzone zmiany zostaną utracone.</p>
            <div className="mt-4 flex gap-2.5">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmClose(false)}>
                Wróć do edycji
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => router.back()}>
                Odrzuć
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
