"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { useCat } from "@/context/CatContext";
import { AVATARS } from "@/lib/constants";
import { demoLogs } from "@/lib/demo";
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

const TOYS = ["Pióro", "Futro", "Sznurek / wstążka", "Szelest / dźwięk", "Miękkie do gryzienia", "Twarde do klepania"];

const HUNTING: { v: HuntingStyle; l: string; icon: IconName }[] = [
  { v: "air", l: "Powietrzny (ptaki, skoki)", icon: "feather" },
  { v: "ground", l: "Naziemny (myszy, podłoga)", icon: "yarn" },
  { v: "mixed", l: "Różnie / nie wiem", icon: "paw" },
];

const TEMPER: { v: Temperament; l: string }[] = [
  { v: "confident", l: "Pewny siebie, atletyczny" },
  { v: "timid", l: "Ostrożny, lękliwy" },
  { v: "lowEnergy", l: "Spokojny / senior" },
];

const ENGAGE: { v: Engagement; l: string }[] = [
  { v: "easy", l: "Łatwo go wciągnąć" },
  { v: "hard", l: "Trudno go zachęcić" },
  { v: "none", l: "W ogóle nie chce" },
];

const labelCls = "mb-2 block p-0 font-hand text-sm font-semibold";
const fieldCls = "min-w-0 border-0 p-0";

export function Onboarding() {
  const { saveProfile, savePlayProfile, saveLogs } = useCat();
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // płynne przewinięcie na górę przy każdej zmianie kroku
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<IconName>("cat");
  const [sex, setSex] = useState<Sex>("kot");
  const [indoor, setIndoor] = useState<LifeMode>("domowy");
  const [multi, setMulti] = useState(false);

  const [huntingStyle, setHuntingStyle] = useState<HuntingStyle>("mixed");
  const [temperament, setTemperament] = useState<Temperament>("confident");
  const [engagement, setEngagement] = useState<Engagement>("easy");
  const [toyPrefs, setToyPrefs] = useState<string[]>([]);
  const [nightWaking, setNightWaking] = useState<PlayProfile["nightWaking"]>("unknown");

  const finish = (withDemo: boolean) => {
    const profile: CatProfile = { name: name.trim() || "Kotek", avatar, sex, indoor, multi };
    const play: PlayProfile = { huntingStyle, temperament, engagement, toyPrefs, nightWaking };
    saveProfile(profile);
    savePlayProfile(play);
    if (withDemo) saveLogs(demoLogs());
  };

  const toggleToy = (t: string) =>
    setToyPrefs((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const STEPS = 3;

  return (
    <div
      ref={scrollRef}
      className="flex min-h-[100dvh] justify-center overflow-y-auto p-4"
    >
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
            <div
              className="sketch-box sketch-box-alt my-2"
              aria-hidden="true"
            >
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
                setName("Mruczek");
                finish(true);
              }}
            >
              Wypełnij danymi demo
            </Button>
            <p className="mt-3 max-w-[34ch] text-xs leading-normal text-ink-faint">
              Kotek wspiera obserwację i rytuał — nie zastępuje lekarza weterynarii.
            </p>
          </div>
        )}

        {/* ---------- KROK 1: profil ---------- */}
        {step === 1 && (
          <div
            key="step-1"
            className="flex flex-col gap-4 duration-300 ease-out animate-in fade-in slide-in-from-bottom-2"
          >
            <header>
              <h2 className="mb-1 text-2xl">Poznajmy Twojego kota</h2>
              <p className="text-sm text-ink-soft">Kilka podstaw, żeby dopasować wskazówki.</p>
            </header>

            <div>
              <label className={labelCls} htmlFor="name">
                Imię kota
              </label>
              <input
                id="name"
                className="min-h-11 w-full rounded-[var(--r-box)] border-2 border-ink bg-paper px-3.5 py-3 font-mono text-base text-ink placeholder:text-ink-faint"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Mruczek"
                autoComplete="off"
              />
            </div>

            <fieldset className={fieldCls}>
              <legend className={labelCls}>Awatar</legend>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={avatar === a}
                    aria-label={`Awatar ${a}`}
                    className={cn(
                      "inline-flex rounded-[var(--r-chip)] border-2 border-ink bg-paper p-2",
                      avatar === a && "bg-ink text-paper",
                    )}
                    onClick={() => setAvatar(a)}
                  >
                    <Icon name={a} size={34} />
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-4 max-[420px]:grid-cols-1">
              <fieldset className={fieldCls}>
                <legend className={labelCls}>Płeć</legend>
                <div className="flex flex-wrap gap-2">
                  {(["kot", "kotka"] as Sex[]).map((s) => (
                    <ToggleChip key={s} selected={sex === s} onClick={() => setSex(s)}>
                      {s}
                    </ToggleChip>
                  ))}
                </div>
              </fieldset>
              <fieldset className={fieldCls}>
                <legend className={labelCls}>Tryb życia</legend>
                <div className="flex flex-wrap gap-2">
                  {(["domowy", "wychodzący"] as LifeMode[]).map((s) => (
                    <ToggleChip key={s} selected={indoor === s} onClick={() => setIndoor(s)}>
                      {s}
                    </ToggleChip>
                  ))}
                </div>
              </fieldset>
            </div>

            <ToggleChip selected={multi} onClick={() => setMulti(!multi)} className="self-start">
              {multi && <Icon name="check" size={16} />}
              Mieszka z innymi zwierzętami
            </ToggleChip>

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
              <h2 className="mb-1 text-2xl">Jak {name.trim() || "kot"} się bawi?</h2>
              <p className="text-sm text-ink-soft">
                Dzięki temu wskazówki zabawy będą trafiać w styl Twojego kota.
              </p>
            </header>

            <fieldset className={fieldCls}>
              <legend className={labelCls}>Styl łowiecki</legend>
              <div className="flex flex-col gap-2">
                {HUNTING.map((h) => (
                  <ToggleChip
                    key={h.v}
                    selected={huntingStyle === h.v}
                    onClick={() => setHuntingStyle(h.v)}
                    className="justify-start"
                  >
                    <Icon name={h.icon} size={18} />
                    {h.l}
                  </ToggleChip>
                ))}
              </div>
            </fieldset>

            <fieldset className={fieldCls}>
              <legend className={labelCls}>Temperament</legend>
              <div className="flex flex-wrap gap-2">
                {TEMPER.map((t) => (
                  <ToggleChip
                    key={t.v}
                    selected={temperament === t.v}
                    onClick={() => setTemperament(t.v)}
                  >
                    {t.l}
                  </ToggleChip>
                ))}
              </div>
            </fieldset>

            <fieldset className={fieldCls}>
              <legend className={labelCls}>Chęć do zabawy</legend>
              <div className="flex flex-wrap gap-2">
                {ENGAGE.map((e) => (
                  <ToggleChip
                    key={e.v}
                    selected={engagement === e.v}
                    onClick={() => setEngagement(e.v)}
                  >
                    {e.l}
                  </ToggleChip>
                ))}
              </div>
            </fieldset>

            <fieldset className={fieldCls}>
              <legend className={labelCls}>Co lubi? (możesz zaznaczyć kilka)</legend>
              <div className="flex flex-wrap gap-2">
                {TOYS.map((t) => (
                  <ToggleChip key={t} selected={toyPrefs.includes(t)} onClick={() => toggleToy(t)}>
                    {t}
                  </ToggleChip>
                ))}
              </div>
            </fieldset>

            <fieldset className={fieldCls}>
              <legend className={labelCls}>Budzi Cię w nocy lub nad ranem?</legend>
              <div className="flex flex-wrap gap-2">
                {([
                  ["yes", "Tak"],
                  ["no", "Nie"],
                  ["unknown", "Nie wiem"],
                ] as const).map(([v, l]) => (
                  <ToggleChip key={v} selected={nightWaking === v} onClick={() => setNightWaking(v)}>
                    {l}
                  </ToggleChip>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Pomaga dostroić porę wieczornego wyciszenia.
              </p>
            </fieldset>

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
