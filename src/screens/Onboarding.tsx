"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import {
  ProfileFields,
  PlayFields,
  NotesField,
  emptyCatForm,
  catFormToProfile,
  catFormToPlay,
  type CatFormValues,
} from "@/components/CatProfileFields";
import { useCat } from "@/context/CatContext";
import { demoLogs } from "@/lib/demo";
import { cn } from "@/lib/utils";

export function Onboarding() {
  const { saveProfile, savePlayProfile, saveLogs } = useCat();
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // płynne przewinięcie na górę przy każdej zmianie kroku
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const [v, setV] = useState<CatFormValues>(emptyCatForm);
  const set = (p: Partial<CatFormValues>) => setV((s) => ({ ...s, ...p }));

  const finish = (withDemo: boolean) => {
    saveProfile(catFormToProfile(v));
    savePlayProfile(catFormToPlay(v));
    if (withDemo) saveLogs(demoLogs());
  };

  const STEPS = 3;

  return (
    <div ref={scrollRef} className="flex min-h-[100dvh] justify-center overflow-y-auto p-4">
      <div className="mt-6 w-full max-w-[520px]">
        {/* pasek postępu */}
        {step > 0 && (
          <div className="mb-6 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: STEPS - 1 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-[5px] flex-1 rounded-full border-[1.5px] border-ink bg-paper",
                  i < step && "bg-ink",
                )}
              />
            ))}
          </div>
        )}

        {/* ---------- KROK 0: powitanie ---------- */}
        {step === 0 && (
          <div
            key="step-0"
            className="flex flex-col items-center gap-3 pt-6 text-center duration-300 ease-out animate-in fade-in slide-in-from-bottom-2"
          >
            <span className="tag">cześć!</span>
            <div className="sketch-box sketch-box-alt my-2" aria-hidden="true">
              <Icon name="cat" size={96} strokeWidth={1.6} />
            </div>
            <h1 className="mb-3 text-[2rem]">Kotek</h1>
            <Button block size="lg" onClick={() => setStep(1)}>
              Zaczynamy
              <Icon name="arrowRight" size={22} />
            </Button>
            <Button
              block
              variant="ghost"
              onClick={() => {
                set({ name: "Mruczek" });
                // finish() używa aktualnego v; ustawiamy imię i kończymy w jednym geście
                saveProfile(catFormToProfile({ ...v, name: "Mruczek" }));
                savePlayProfile(catFormToPlay({ ...v, name: "Mruczek" }));
                saveLogs(demoLogs());
              }}
            >
              Wypełnij danymi demo
            </Button>
            <p className="mt-3 max-w-[34ch] text-xs leading-normal text-ink-faint">
              Kotek wspiera obserwację i rytuał — nie zastępuje lekarza weterynarii.
            </p>
          </div>
        )}

        {/* ---------- KROK 1: profil + notatka ---------- */}
        {step === 1 && (
          <div
            key="step-1"
            className="flex flex-col gap-4 duration-300 ease-out animate-in fade-in slide-in-from-bottom-2"
          >
            <header>
              <h2 className="mb-1 text-2xl">Poznajmy Twojego kota</h2>
              <p className="text-sm text-ink-soft">Kilka podstaw, żeby dopasować wskazówki.</p>
            </header>

            <ProfileFields v={v} set={set} />
            <NotesField v={v} set={set} />

            <div className="mt-3 flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <Icon name="arrowRight" size={19} className="rotate-180" />
                Wstecz
              </Button>
              <Button onClick={() => setStep(2)}>
                Dalej
                <Icon name="arrowRight" size={19} />
              </Button>
            </div>
          </div>
        )}

        {/* ---------- KROK 2: profil zabawy ---------- */}
        {step === 2 && (
          <div
            key="step-2"
            className="flex flex-col gap-4 duration-300 ease-out animate-in fade-in slide-in-from-bottom-2"
          >
            <header>
              <h2 className="mb-1 text-2xl">Jak {v.name.trim() || "kot"} się bawi?</h2>
              <p className="text-sm text-ink-soft">
                Dzięki temu wskazówki zabawy będą trafiać w styl Twojego kota.
              </p>
            </header>

            <PlayFields v={v} set={set} />

            <div className="mt-3 flex justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <Icon name="arrowRight" size={19} className="rotate-180" />
                Wstecz
              </Button>
              <Button onClick={() => finish(false)}>
                <Icon name="check" size={19} />
                Gotowe
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
