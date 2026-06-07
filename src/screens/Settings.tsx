"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { NoteEditor } from "@/components/NoteEditor";
import { useCat } from "@/context/CatContext";
import { demoLogs } from "@/lib/demo";

export function Settings() {
  const { profile, logs, saveProfile, saveLogs, resetAll } = useCat();
  const [notes, setNotes] = useState(profile?.notes ?? "");
  const [savedMsg, setSavedMsg] = useState("");

  if (!profile) return null;

  const save = () => {
    saveProfile({ ...profile, notes });
    setSavedMsg("Zapisano ✓");
    window.setTimeout(() => setSavedMsg(""), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <span className="tag">ustawienia</span>
        <h1 className="mt-3 text-2xl">{profile.name}</h1>
        <p className="text-sm text-ink-soft">
          {profile.sex}, {profile.indoor}
          {profile.multi ? ", mieszka z innymi zwierzętami" : ""}
        </p>
      </header>

      {/* notatki — edytor TipTap */}
      <section className="sketch-box">
        <label className="block font-hand text-xl font-semibold" id="notes-label">
          Notatki o kocie
        </label>
        <p className="mb-2 text-sm text-ink-soft">
          Rasa, choroby przewlekłe, charakter — to kontekst dla porad.
        </p>
        <NoteEditor
          value={notes}
          onChange={setNotes}
          placeholder="np. brytyjczyk, 9 lat, nadczynność tarczycy…"
          ariaLabel="Notatki o kocie"
        />
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={save}>
          <Icon name="check" size={19} />
          Zapisz zmiany
        </Button>
        {savedMsg && <span className="text-sm text-ink-faint">{savedMsg}</span>}
      </div>

      {/* dane */}
      <section className="sketch-box">
        <h2 className="text-xl">Dane</h2>
        <p className="mb-3 text-sm text-ink-soft">Wpisów w dzienniku: {logs.length}</p>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" block onClick={() => saveLogs(demoLogs())}>
            <Icon name="sparkle" size={19} />
            Wczytaj dane demo (21 dni)
          </Button>
          <Button
            variant="ghost"
            block
            onClick={() => {
              if (
                window.confirm(
                  "Wyczyścić dziennik i zacząć od nowa? Profil i wpisy zostaną skasowane, a aplikacja wróci do onboardingu. Tej operacji nie można cofnąć.",
                )
              ) {
                resetAll();
              }
            }}
          >
            <Icon name="close" size={19} />
            Wyczyść dziennik
          </Button>
        </div>
      </section>

      <p className="px-6 text-center text-xs text-ink-faint">
        Kotek wspiera obserwację i rytuał — nie zastępuje diagnozy lekarza weterynarii.
      </p>
    </div>
  );
}
