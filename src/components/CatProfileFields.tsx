"use client";

/* =============================================================
   Kotek — współdzielone pola profilu kota.
   Te same kontrolki używane są w onboardingu i w trybie edycji
   w Ustawieniach, dzięki czemu edycja wygląda 1:1 jak onboarding.
   ============================================================= */

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { NoteEditor } from "@/components/NoteEditor";
import { AVATARS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type {
  CatProfile,
  PlayProfile,
  Sex,
  LifeMode,
  HuntingStyle,
  Temperament,
  Engagement,
} from "@/lib/types";

export const TOYS = [
  "Pióro",
  "Futro",
  "Sznurek / wstążka",
  "Szelest / dźwięk",
  "Miękkie do gryzienia",
  "Twarde do klepania",
];

/* płeć: wartość "kot" = samiec (etykieta „kocur"), "kotka" = samica */
export const SEX: { v: Sex; l: string }[] = [
  { v: "kot", l: "kocur" },
  { v: "kotka", l: "kotka" },
];
export const sexLabel = (s: Sex | undefined) => SEX.find((x) => x.v === s)?.l ?? "—";

export const HUNTING: { v: HuntingStyle; l: string; icon: IconName }[] = [
  { v: "air", l: "Powietrzny (ptaki, skoki)", icon: "feather" },
  { v: "ground", l: "Naziemny (myszy, podłoga)", icon: "yarn" },
  { v: "mixed", l: "Różnie / nie wiem", icon: "paw" },
];

export const TEMPER: { v: Temperament; l: string }[] = [
  { v: "confident", l: "Pewny siebie, atletyczny" },
  { v: "timid", l: "Ostrożny, lękliwy" },
  { v: "lowEnergy", l: "Spokojny / senior" },
];

export const ENGAGE: { v: Engagement; l: string }[] = [
  { v: "easy", l: "Łatwo go wciągnąć" },
  { v: "hard", l: "Trudno go zachęcić" },
  { v: "none", l: "W ogóle nie chce" },
];

export const NIGHT: { v: NonNullable<PlayProfile["nightWaking"]>; l: string }[] = [
  { v: "yes", l: "Tak" },
  { v: "no", l: "Nie" },
  { v: "unknown", l: "Nie wiem" },
];

/* hand-drawn ikony przy etykietach pól (używane też w podsumowaniu Ustawień) */
export const FIELD_ICONS = {
  sex: "gender",
  neutered: "scissors",
  indoor: "house",
  multi: "social",
  huntingStyle: "paw",
  temperament: "mood",
  engagement: "yarn",
  toyPrefs: "feather",
  nightWaking: "sleep",
} satisfies Record<string, IconName>;

const fieldCls = "min-w-0 border-0 p-0";

/* legenda z ikoną — spójny wygląd etykiet pól */
function FieldLegend({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <legend className="mb-2 flex items-center gap-1.5 p-0 font-hand text-sm font-semibold">
      <Icon name={icon} size={20} />
      {children}
    </legend>
  );
}

/* --- wspólny stan formularza --- */
export interface CatFormValues {
  name: string;
  avatar: IconName;
  sex: Sex;
  neutered: boolean;
  indoor: LifeMode;
  multi: boolean;
  huntingStyle: HuntingStyle;
  temperament: Temperament;
  engagement: Engagement;
  toyPrefs: string[];
  nightWaking: PlayProfile["nightWaking"];
  notes: string;
}

export const emptyCatForm: CatFormValues = {
  name: "",
  avatar: "cat",
  sex: "kot",
  neutered: false,
  indoor: "domowy",
  multi: false,
  huntingStyle: "mixed",
  temperament: "confident",
  engagement: "easy",
  toyPrefs: [],
  nightWaking: "unknown",
  notes: "",
};

export function catFormFromState(profile: CatProfile, play: PlayProfile | null): CatFormValues {
  return {
    name: profile.name,
    avatar: profile.avatar as IconName,
    sex: profile.sex,
    neutered: profile.neutered ?? false,
    indoor: profile.indoor,
    multi: profile.multi,
    huntingStyle: play?.huntingStyle ?? "mixed",
    temperament: play?.temperament ?? "confident",
    engagement: play?.engagement ?? "easy",
    toyPrefs: play?.toyPrefs ?? [],
    nightWaking: play?.nightWaking ?? "unknown",
    notes: profile.notes ?? "",
  };
}

export function catFormToProfile(v: CatFormValues): CatProfile {
  return {
    name: v.name.trim() || "Kotek",
    avatar: v.avatar,
    sex: v.sex,
    neutered: v.neutered,
    indoor: v.indoor,
    multi: v.multi,
    notes: v.notes,
  };
}

export function catFormToPlay(v: CatFormValues): PlayProfile {
  return {
    huntingStyle: v.huntingStyle,
    temperament: v.temperament,
    engagement: v.engagement,
    toyPrefs: v.toyPrefs,
    nightWaking: v.nightWaking,
  };
}

type Patch = (p: Partial<CatFormValues>) => void;

/* ---------- pola profilu (krok 1 onboardingu) ---------- */
export function ProfileFields({ v, set }: { v: CatFormValues; set: Patch }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 flex items-center gap-1.5 p-0 font-hand text-sm font-semibold" htmlFor="name">
          <Icon name="cat" size={20} />
          Imię kota
        </label>
        <input
          id="name"
          className="min-h-11 w-full rounded-[var(--r-box)] border-2 border-ink bg-paper px-3.5 py-3 font-mono text-base text-ink placeholder:text-ink-faint"
          value={v.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="np. Mruczek"
          autoComplete="off"
        />
      </div>

      <fieldset className={fieldCls}>
        <FieldLegend icon="sparkle">Awatar</FieldLegend>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={v.avatar === a}
              aria-label={`Awatar ${a}`}
              className={cn(
                "inline-flex rounded-[var(--r-chip)] border-2 border-ink bg-paper p-2",
                v.avatar === a && "bg-ink text-paper",
              )}
              onClick={() => set({ avatar: a })}
            >
              <Icon name={a} size={34} />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4 max-[420px]:grid-cols-1">
        <fieldset className={fieldCls}>
          <FieldLegend icon={FIELD_ICONS.sex}>Płeć</FieldLegend>
          <div className="flex flex-wrap gap-2">
            {SEX.map((s) => (
              <ToggleChip key={s.v} selected={v.sex === s.v} onClick={() => set({ sex: s.v })}>
                {s.l}
              </ToggleChip>
            ))}
          </div>
        </fieldset>
        <fieldset className={fieldCls}>
          <FieldLegend icon={FIELD_ICONS.indoor}>Tryb życia</FieldLegend>
          <div className="flex flex-wrap gap-2">
            {(["domowy", "wychodzący"] as LifeMode[]).map((s) => (
              <ToggleChip key={s} selected={v.indoor === s} onClick={() => set({ indoor: s })}>
                {s}
              </ToggleChip>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className={fieldCls}>
        <FieldLegend icon={FIELD_ICONS.neutered}>Sterylizacja / kastracja</FieldLegend>
        <div className="flex flex-wrap gap-2">
          {([
            [true, "Tak"],
            [false, "Nie"],
          ] as const).map(([val, l]) => (
            <ToggleChip key={l} selected={v.neutered === val} onClick={() => set({ neutered: val })}>
              {l}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      <fieldset className={fieldCls}>
        <FieldLegend icon={FIELD_ICONS.multi}>Inne zwierzęta w domu</FieldLegend>
        <ToggleChip selected={v.multi} onClick={() => set({ multi: !v.multi })} className="self-start">
          {v.multi && <Icon name="check" size={16} />}
          Mieszka z innymi zwierzętami
        </ToggleChip>
      </fieldset>
    </div>
  );
}

/* ---------- pola profilu zabawy (krok 2 onboardingu) ---------- */
export function PlayFields({ v, set }: { v: CatFormValues; set: Patch }) {
  const toggleToy = (t: string) =>
    set({ toyPrefs: v.toyPrefs.includes(t) ? v.toyPrefs.filter((x) => x !== t) : [...v.toyPrefs, t] });

  return (
    <div className="flex flex-col gap-4">
      <fieldset className={fieldCls}>
        <FieldLegend icon={FIELD_ICONS.huntingStyle}>Styl łowiecki</FieldLegend>
        <div className="flex flex-col gap-2">
          {HUNTING.map((h) => (
            <ToggleChip
              key={h.v}
              selected={v.huntingStyle === h.v}
              onClick={() => set({ huntingStyle: h.v })}
              className="justify-start"
            >
              <Icon name={h.icon} size={18} />
              {h.l}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      <fieldset className={fieldCls}>
        <FieldLegend icon={FIELD_ICONS.temperament}>Temperament</FieldLegend>
        <div className="flex flex-wrap gap-2">
          {TEMPER.map((t) => (
            <ToggleChip
              key={t.v}
              selected={v.temperament === t.v}
              onClick={() => set({ temperament: t.v })}
            >
              {t.l}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      <fieldset className={fieldCls}>
        <FieldLegend icon={FIELD_ICONS.engagement}>Chęć do zabawy</FieldLegend>
        <div className="flex flex-wrap gap-2">
          {ENGAGE.map((e) => (
            <ToggleChip
              key={e.v}
              selected={v.engagement === e.v}
              onClick={() => set({ engagement: e.v })}
            >
              {e.l}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      <fieldset className={fieldCls}>
        <FieldLegend icon={FIELD_ICONS.toyPrefs}>Co lubi? (możesz zaznaczyć kilka)</FieldLegend>
        <div className="flex flex-wrap gap-2">
          {TOYS.map((t) => (
            <ToggleChip key={t} selected={v.toyPrefs.includes(t)} onClick={() => toggleToy(t)}>
              {t}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      <fieldset className={fieldCls}>
        <FieldLegend icon={FIELD_ICONS.nightWaking}>Budzi Cię w nocy lub nad ranem?</FieldLegend>
        <div className="flex flex-wrap gap-2">
          {NIGHT.map(({ v: nv, l }) => (
            <ToggleChip key={nv} selected={v.nightWaking === nv} onClick={() => set({ nightWaking: nv })}>
              {l}
            </ToggleChip>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-faint">Pomaga dostroić porę wieczornego wyciszenia.</p>
      </fieldset>
    </div>
  );
}

/* ---------- notatka o kocie ---------- */
export function NotesField({ v, set }: { v: CatFormValues; set: Patch }) {
  return (
    <fieldset className={fieldCls}>
      <FieldLegend icon="note">Notatki o kocie</FieldLegend>
      <p className="mb-2 text-xs text-ink-faint">
        Rasa, choroby przewlekłe, charakter — to kontekst dla porad.
      </p>
      <NoteEditor
        value={v.notes}
        onChange={(html) => set({ notes: html })}
        placeholder="np. brytyjczyk, 9 lat, nadczynność tarczycy…"
        ariaLabel="Notatki o kocie"
      />
    </fieldset>
  );
}
