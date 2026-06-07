"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { Button } from "@/components/ui/button";
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
import { demoLogs } from "@/lib/demo";

function label<T extends string>(list: { v: T; l: string }[], value: T | undefined): string {
  return list.find((x) => x.v === value)?.l ?? "—";
}

function Row({ icon, term, children }: { icon: IconName; term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink/10 py-2.5 last:border-0 sm:flex-row sm:gap-3">
      <dt className="flex items-center gap-1.5 font-hand text-sm font-semibold text-ink-soft sm:w-52 sm:shrink-0">
        <Icon name={icon} size={20} />
        {term}
      </dt>
      <dd className="text-sm text-ink sm:pl-0">{children}</dd>
    </div>
  );
}

export function Settings() {
  const { profile, playProfile, logs, saveProfile, savePlayProfile, saveLogs, resetAll } = useCat();
  const { user, signOut } = useAuth();
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
        <header>
          <span className="tag">edycja profilu</span>
          <h1 className="mt-3 text-2xl">Edytuj {profile.name}</h1>
          <p className="text-sm text-ink-soft">Zmień dane wprowadzone podczas powitania.</p>
        </header>

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

  /* ---------- PODSUMOWANIE ---------- */
  return (
    <div className="flex flex-col gap-5">
      {/* imię + przycisk edycji w jednej linii */}
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl leading-tight">Ustawienia · {profile.name}</h1>
        <Button variant="secondary" onClick={startEdit} className="shrink-0">
          <Icon name="edit" size={18} />
          Edytuj
        </Button>
      </header>

      {/* podsumowanie danych z onboardingu (bez ramki) */}
      <section className="flex flex-col">
        <dl className="flex flex-col">
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

        {/* notatka o kocie z onboardingu — widok tylko do odczytu */}
        <div className="mt-4 flex flex-col gap-1.5">
          <h2 className="flex items-center gap-1.5 font-hand text-sm font-semibold text-ink-soft">
            <Icon name="note" size={20} />
            Notatki o kocie
          </h2>
          {hasNote ? (
            <div
              className="tiptap text-sm leading-relaxed text-ink"
              dangerouslySetInnerHTML={{ __html: noteHtml }}
            />
          ) : (
            <p className="text-sm text-ink-faint">Brak notatek — dodasz je przez „Edytuj".</p>
          )}
        </div>

        {savedMsg && <p className="mt-3 text-sm text-ink-faint">{savedMsg}</p>}
      </section>

      {/* dane — bez ramki, bez nagłówka */}
      <section className="flex flex-col gap-2">
        <p className="text-sm text-ink-soft">Wpisów w dzienniku: {logs.length}</p>
        <Button variant="secondary" block onClick={() => saveLogs(demoLogs())}>
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

      {/* konto */}
      <section className="flex flex-col gap-2">
        {user?.email && <p className="text-sm text-ink-soft">Zalogowano jako: {user.email}</p>}
        <Button variant="secondary" block onClick={() => void signOut()}>
          <Icon name="arrowRight" size={19} />
          Wyloguj
        </Button>
      </section>

      <p className="px-6 text-center text-xs text-ink-faint">
        Kotek wspiera obserwację i rytuał — nie zastępuje diagnozy lekarza weterynarii.
      </p>
    </div>
  );
}
