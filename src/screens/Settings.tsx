"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Squiggle } from "@/components/Squiggle";
import {
  ProfileFields,
  PlayFields,
  NotesField,
  catFormFromState,
  catFormToProfile,
  catFormToPlay,
  HUNTING,
  TEMPER,
  ENGAGE,
  NIGHT,
  FIELD_ICONS,
  sexLabel,
  type CatFormValues,
} from "@/components/CatProfileFields";
import { useCat } from "@/context/CatContext";
import { useAuth } from "@/context/AuthContext";
import { demoLogs, mergeLogs } from "@/lib/demo";
import { sanitizeNoteHtml } from "@/lib/sanitize";
import { Art } from "@/components/Illustration";

function label<T extends string>(list: { v: T; l: string }[], value: T | undefined): string {
  return list.find((x) => x.v === value)?.l ?? "—";
}

function Row({ icon, term, children }: { icon: IconName; term: string; children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-3">
        <dt className="flex items-center gap-1.5 font-hand text-sm font-semibold text-ink-soft sm:w-52 sm:shrink-0">
          <Icon name={icon} size={20} />
          {term}
        </dt>
        <dd className="text-sm text-ink sm:pl-0">{children}</dd>
      </div>
      <Squiggle className="opacity-70" />
    </>
  );
}

/* ---------- kategorie menu ustawień ---------- */
type SectionKey = "kot";

const CATEGORIES: { key: SectionKey; label: string; hint: string; icon: IconName; href?: string }[] = [
  { key: "kot", label: "Profil Kotka", hint: "Notatki, temperament, choroby", icon: "cat" },
];

const LINK_CATEGORIES: { href: string; label: string; hint: string; icon: IconName }[] = [
  { href: "/docs", label: "Dokumentacja", hint: "API, MCP i tokeny", icon: "note" },
  { href: "/agenci", label: "Zarządzanie planem PRO", hint: "Agenci behawiorysty", icon: "agents" },
];

export function Settings() {
  const { profile, playProfile, logs, saveProfile, savePlayProfile, saveLogs, resetAll } = useCat();
  const { user, signOut } = useAuth();
  const [section, setSection] = useState<SectionKey | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CatFormValues | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  if (!profile) return null;

  const startEdit = () => {
    setForm(catFormFromState(profile, playProfile));
    setEditing(true);
  };

  const set = (p: Partial<CatFormValues>) => setForm((s) => (s ? { ...s, ...p } : s));

  const saveEdit = () => {
    if (!form) return;
    saveProfile(catFormToProfile(form));
    savePlayProfile(catFormToPlay(form));
    setEditing(false);
    setSavedMsg("Zapisano ✓");
    window.setTimeout(() => setSavedMsg(""), 2500);
  };

  /* ---------- TRYB EDYCJI (taki sam widok jak onboarding) ---------- */
  if (editing && form) {
    return (
      <div className="flex flex-col gap-4">
        <header className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setEditing(false)} className="shrink-0 px-2">
            <Icon name="arrowRight" size={20} className="rotate-180" />
            <span className="sr-only">Wróć</span>
          </Button>
          <h1 className="text-2xl leading-tight text-right">Edytuj {profile.name}</h1>
        </header>
        <Squiggle className="opacity-70" />
        <p className="-mt-1 text-sm text-ink-soft">Zmień dane wprowadzone podczas powitania.</p>

        <ProfileFields v={form} set={set} />
        <PlayFields v={form} set={set} />
        <NotesField v={form} set={set} />

        <div className="mt-3 flex justify-between gap-3">
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Anuluj
          </Button>
          <Button onClick={saveEdit}>
            <Icon name="check" size={19} />
            Zapisz zmiany
          </Button>
        </div>
      </div>
    );
  }

  const noteHtml = profile.notes ?? "";
  const hasNote = noteHtml.replace(/<[^>]*>/g, "").trim().length > 0;

  /* ---------- EKRAN GŁÓWNY USTAWIEŃ ---------- */
  if (!section) {
    return (
      <div className="flex flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <Button variant="ghost" asChild className="shrink-0 px-2">
            <Link href="/">
              <Icon name="arrowRight" size={20} className="rotate-180" />
              <span className="sr-only">Wróć</span>
            </Link>
          </Button>
          <h1 className="text-2xl leading-tight text-right">{profile.name}: Ustawienia</h1>
        </header>
        <Squiggle className="opacity-70" />

        <nav className="flex flex-col gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSection(c.key)}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-ink/25 bg-paper px-4 py-3.5 text-left transition-colors hover:border-ink/50"
            >
              <span className="flex flex-col">
                <span className="font-hand text-base font-semibold leading-tight text-ink">{c.label}</span>
                <span className="text-xs text-ink-faint">{c.hint}</span>
              </span>
              <Icon name="arrowRight" size={18} className="ml-auto shrink-0 text-ink-faint" />
            </button>
          ))}
          {LINK_CATEGORIES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-ink/25 bg-paper px-4 py-3.5 text-left transition-colors hover:border-ink/50"
            >
              <span className="flex flex-col">
                <span className="font-hand text-base font-semibold leading-tight text-ink">{c.label}</span>
                <span className="text-xs text-ink-faint">{c.hint}</span>
              </span>
              <Icon name="arrowRight" size={18} className="ml-auto shrink-0 text-ink-faint" />
            </Link>
          ))}
        </nav>

        <Art name="zabawa-logiczna" size={220} className="mx-auto" />

        <section className="flex flex-col gap-2">
          <p className="text-center text-sm text-ink-soft">Wpisy w dzienniku: {logs.length}</p>
          <Button variant="secondary" block onClick={() => saveLogs(mergeLogs(logs, demoLogs()))}>
            <Icon name="sparkle" size={19} />
            Wczytaj dane demo (21 dni)
          </Button>
          <Button
            variant="secondary"
            block
            onClick={() => {
              if (
                window.confirm(
                  "Wyczyścić dziennik i zacząć od nowa? Profil i wpisy zostaną skasowane, a aplikacja wróci do powitania. Tej operacji nie można cofnąć.",
                )
              ) {
                resetAll();
              }
            }}
          >
            <Icon name="close" size={19} />
            Wyczyść dziennik
          </Button>
        </section>

        <section className="flex flex-col gap-2">
          {user?.email && <p className="text-center text-sm text-ink-soft">Zalogowano jako: {user.email}</p>}
          <Button variant="primary" block onClick={() => void signOut()}>
            <Icon name="arrowRight" size={19} />
            Wyloguj
          </Button>
        </section>
      </div>
    );
  }

  const activeCat = CATEGORIES.find((c) => c.key === section)!;

  /* ---------- SZCZEGÓŁY PROFILU KOTA ---------- */
  return (
    <div className="flex flex-col gap-5">
      {/* nagłówek z powrotem do listy kategorii */}
      <header className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setSection(null)} className="shrink-0 px-2">
          <Icon name="arrowRight" size={20} className="rotate-180" />
          <span className="sr-only">Wróć</span>
        </Button>
        <h1 className="flex items-center gap-2 text-2xl leading-tight text-right">
          <Icon name={activeCat.icon} size={24} className="text-ink-soft" />
          {activeCat.label}
        </h1>
      </header>
      <Squiggle className="opacity-70" />

      <section className="flex flex-col">
        <div className="mb-3 flex justify-end">
          <Button variant="secondary" onClick={startEdit} className="shrink-0">
            <Icon name="edit" size={18} />
            Edytuj
          </Button>
        </div>
        <dl className="flex flex-col [&>svg:last-child]:hidden">
          <Row icon={FIELD_ICONS.sex} term="Płeć">
            {sexLabel(profile.sex)}
          </Row>
          <Row icon={FIELD_ICONS.neutered} term="Sterylizacja / kastracja">
            {profile.neutered ? "tak" : "nie"}
          </Row>
          <Row icon={FIELD_ICONS.indoor} term="Tryb życia">
            {profile.indoor}
          </Row>
          <Row icon={FIELD_ICONS.multi} term="Inne zwierzęta">
            {profile.multi ? "tak" : "nie"}
          </Row>
          <Row icon={FIELD_ICONS.huntingStyle} term="Styl łowiecki">
            {label(HUNTING, playProfile?.huntingStyle)}
          </Row>
          <Row icon={FIELD_ICONS.temperament} term="Temperament">
            {label(TEMPER, playProfile?.temperament)}
          </Row>
          <Row icon={FIELD_ICONS.engagement} term="Chęć do zabawy">
            {label(ENGAGE, playProfile?.engagement)}
          </Row>
          <Row icon={FIELD_ICONS.toyPrefs} term="Ulubione zabawki">
            {playProfile?.toyPrefs.length ? playProfile.toyPrefs.join(", ") : "—"}
          </Row>
          <Row icon={FIELD_ICONS.nightWaking} term="Budzi w nocy">
            {label(NIGHT, playProfile?.nightWaking)}
          </Row>
        </dl>

        <div className="mt-4 flex flex-col gap-1.5">
          <h2 className="flex items-center gap-1.5 font-hand text-sm font-semibold text-ink-soft">
            <Icon name="note" size={20} />
            Notatki o kocie
          </h2>
          {hasNote ? (
            <div
              className="tiptap text-sm leading-relaxed text-ink"
              dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(noteHtml) }}
            />
          ) : (
            <p className="text-sm text-ink-faint">Brak notatek — dodasz je przez „Edytuj".</p>
          )}
        </div>

        {savedMsg && <p className="mt-3 text-sm text-ink-faint">{savedMsg}</p>}
      </section>

      <p className="px-6 text-center text-xs text-ink-faint">
        Kotek wspiera obserwację i rytuał — nie zastępuje diagnozy lekarza weterynarii.
      </p>
    </div>
  );
}
