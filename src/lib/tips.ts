/* =============================================================
   Kotek — baza porad merytorycznych (PRD sekcja 4 + 8.3/8.5)
   Porady oparte na etologii klinicznej: sekwencja łowiecka,
   rytuał poluj→jedz→myj→śpij, wyuczone miauczenie o jedzenie,
   5 filarów środowiska, neofobia, koty krepuskularne.

   Porady są otagowane, dzięki czemu ekran „Dziś” potrafi
   dopasować je do statystyk zachowań kota (rankTips).
   ============================================================= */

import type { DayLog, DayMetrics } from "./types";
import { WIN } from "./constants";

export type TipTag =
  | "play" // jak dobrze się bawić (sekwencja łowiecka)
  | "play-air" // łowca powietrzny
  | "play-ground" // łowca naziemny
  | "play-shy" // kot lękliwy / senior / nie chce
  | "begging" // miauczenie o jedzenie (wyuczony nawyk)
  | "night" // nocne budzenie / wokalizacja nocna
  | "ritual" // rytuał poluj→jedz→myj→śpij, timing
  | "environment" // 5 filarów
  | "activity" // spadek aktywności
  | "appetite" // zmiany apetytu
  | "vet" // kiedy do weterynarza
  | "general"; // uniwersalne, zawsze trafne

export interface Tip {
  id: string;
  text: string;
  tags: TipTag[];
}

export const TIPS: Tip[] = [
  /* --- zabawa: sekwencja łowiecka (PRD 4.3, 8.3) --- */
  {
    id: "play-sequence",
    text: "Zabawa to całe polowanie: wpatrywanie → skradanie → atak → „zabawa” ze zdobyczą. Poprowadź zabawkę przez wszystkie te etapy, nie tylko machaj.",
    tags: ["play", "general"],
  },
  {
    id: "play-end-catch",
    text: "Zakończ każdą sesję złapaniem zdobyczy, a zaraz potem posiłkiem — to domyka instynkt łowiecki i daje kotu satysfakcję.",
    tags: ["play", "ritual", "general"],
  },
  {
    id: "play-let-catch",
    text: "Pozwól „złapać” zdobycz co kilka prób. Niedokończona sekwencja frustruje — kot, który nigdy nie wygrywa, szybko rezygnuje.",
    tags: ["play"],
  },
  {
    id: "play-not-at-face",
    text: "Nigdy nie machaj zabawką przy pysku i nie przyciągaj jej w stronę kota. Prawdziwa ofiara ucieka i chowa się — niech kot ją goni, nie odwrotnie.",
    tags: ["play"],
  },
  {
    id: "play-eyes-first",
    text: "Zacznij od wodzenia wzrokiem: powoli przeciągaj zabawkę w pewnej odległości. Samo śledzenie oczami to już pierwszy etap polowania.",
    tags: ["play", "play-shy"],
  },
  {
    id: "play-short-sessions",
    text: "Lepiej kilka krótkich sesji (10–20 min) niż jedna długa. Koty domowe polują „na raty” — częste, krótkie podchody pasują do ich natury.",
    tags: ["play", "general"],
  },
  {
    id: "play-air",
    text: "Łowca powietrzny? Unoś zabawkę, rób skoki i krótkie pauzy w powietrzu — naśladuj ptaka, który przysiada i zrywa się do lotu.",
    tags: ["play", "play-air"],
  },
  {
    id: "play-ground",
    text: "Łowca naziemny? Przeciągaj zabawkę po podłodze i chowaj ją za meble. Ruch poziomy „myszy” przy ziemi wyzwala pościg.",
    tags: ["play", "play-ground"],
  },
  {
    id: "play-no-air-try-ground",
    text: "Kot nie rusza za zabawką w powietrzu? Spróbuj przeciągać ją po podłodze i chować za meble — prawdopodobnie woli polować nisko.",
    tags: ["play", "play-ground"],
  },
  {
    id: "play-neophobia",
    text: "Ucieka od nowej zabawki? To neofobia, nie brak zainteresowania. Zostaw ją w pobliżu na kilka dni, by oswoił zapach, zanim zacznie polować.",
    tags: ["play", "play-shy"],
  },
  {
    id: "play-senior",
    text: "Senior lub kot o niskiej energii? Zacznij od powolnego ruchu tuż obok niego i krótkich sesji. Liczy się udział, nie intensywność.",
    tags: ["play", "play-shy", "activity"],
  },
  {
    id: "play-texture",
    text: "Eksperymentuj z fakturą i dźwiękiem zabawki: pióro, futro, sznurek, szelest. Każdy kot ma swój ulubiony typ „ofiary”.",
    tags: ["play"],
  },
  {
    id: "play-rotate-toys",
    text: "Chowaj część zabawek i wymieniaj je co kilka dni. „Nowa” zabawka to często ta sama, której kot nie widział od tygodnia.",
    tags: ["play", "environment"],
  },

  /* --- rytuał: poluj → jedz → myj → śpij (PRD 4.5) --- */
  {
    id: "ritual-play-then-feed",
    text: "Zasada: najpierw zabawa, potem posiłek. Polowanie przed jedzeniem uruchamia instynkt i daje kotu naturalny, satysfakcjonujący rytm dnia.",
    tags: ["ritual", "general"],
  },
  {
    id: "ritual-crepuscular",
    text: "Koty są krepuskularne — najaktywniejsze o świcie i zmierzchu. Domykaj rytuał poluj→jedz→myj→śpij właśnie wtedy, 2× na dobę.",
    tags: ["ritual", "general"],
  },
  {
    id: "ritual-evening-winddown",
    text: "Wieczorne wyciszenie: energiczna zabawa → ostatni posiłek ~1–1,5 h przed snem → mycie → sen. To wprost rozwiązuje budzenie nad ranem.",
    tags: ["ritual", "night"],
  },
  {
    id: "ritual-unmet-instinct",
    text: "Niezrealizowany instynkt łowiecki wraca jako problemy: nocne nawoływanie, agresja, domaganie się uwagi, załatwianie poza kuwetą. Codzienna zabawa to profilaktyka.",
    tags: ["ritual", "activity", "general"],
  },
  {
    id: "ritual-predictable",
    text: "Wiąż pory z czynnością-kotwicą (np. „po powrocie z pracy”), nie tylko z zegarem. Rutyna przewidywalna, ale elastyczna, obniża napięcie kota.",
    tags: ["ritual", "environment"],
  },

  /* --- miauczenie o jedzenie = wyuczony nawyk (PRD 4.4, 8.5) --- */
  {
    id: "begging-learned",
    text: "Miauczenie o jedzenie to wyuczony nawyk: kot odkrył, że to działa. Każde ustąpienie wzmacnia zachowanie — także to „tylko ten jeden raz”.",
    tags: ["begging", "general"],
  },
  {
    id: "begging-fixed-times",
    text: "Karm o stałych porach i nigdy w reakcji na miauczenie. Bez kontaktu wzrokowego, mówienia i głaskania, gdy kot się naprasza.",
    tags: ["begging"],
  },
  {
    id: "begging-reward-quiet",
    text: "Nagradzaj ciszę, nie hałas. Podaj jedzenie albo uwagę w momencie, gdy kot jest spokojny — uczysz go, że spokój, a nie krzyk, daje efekt.",
    tags: ["begging"],
  },
  {
    id: "begging-extinction-burst",
    text: "Uwaga na wybuch wygaszania: przez pierwsze dni miauczenie może się nasilić. To znak, że metoda działa. Ustąpienie teraz cofnie cały postęp i nauczy „głośniej = skuteczniej”.",
    tags: ["begging", "night"],
  },
  {
    id: "begging-redirect",
    text: "Przekieruj energię przed „oknem” napraszania: krótka zabawa albo mata węchowa / puzzle feeder zajmie kota, zanim zacznie domagać się jedzenia.",
    tags: ["begging", "night"],
  },
  {
    id: "begging-intermittent",
    text: "Najtrwalej utrwala nawyk uleganie „od czasu do czasu”. Konsekwencja całego domu jest ważniejsza niż jednorazowa stanowczość.",
    tags: ["begging"],
  },

  /* --- nocne budzenie (PRD 4.5) --- */
  {
    id: "night-energy-out",
    text: "Kot budzi nad ranem? Wieczorem daj mu się solidnie wybawić i nakarm tuż przed snem — najedzony łowca po polowaniu zwykle zasypia.",
    tags: ["night", "ritual"],
  },
  {
    id: "night-no-reaction",
    text: "Nie reaguj na nocne miauczenie pod drzwiami — nawet zrzędzenie to dla kota nagroda uwagą. Cisza w nocy + rytuał wieczorem działają razem.",
    tags: ["night", "begging"],
  },

  /* --- 5 filarów środowiska (PRD 4.2) --- */
  {
    id: "env-hideouts",
    text: "Zapewnij bezpieczne kryjówki, najlepiej wyżej. Możliwość wejścia w górę i schowania się daje kotu poczucie kontroli i obniża stres.",
    tags: ["environment", "general"],
  },
  {
    id: "env-resources",
    text: "Rozdziel zasoby: miska, woda, kuweta, drapak i legowiska osobno i w kilku miejscach. Woda z dala od miski i kuwety zachęca do picia.",
    tags: ["environment"],
  },
  {
    id: "env-scent",
    text: "Szanuj węch kota: unikaj intensywnych zapachów i nie pierz wszystkich legowisk naraz. Własny zapach w domu to dla kota poczucie bezpieczeństwa.",
    tags: ["environment"],
  },
  {
    id: "env-no-forcing",
    text: "Kontakt przewidywalny i bez przymusu. Pozwól kotu samemu zainicjować pieszczoty — wymuszanie kontaktu buduje napięcie, nie więź.",
    tags: ["environment", "general"],
  },
  {
    id: "env-vertical",
    text: "Półki, parapety i drapaki pionowe powiększają „terytorium” w górę. Dla kota domowego trzeci wymiar to więcej przestrzeni bez metra więcej podłogi.",
    tags: ["environment"],
  },

  /* --- spadek aktywności / sygnały zdrowotne (PRD 4.1, 8.3) --- */
  {
    id: "activity-baseline",
    text: "U kota liczy się zmiana względem jego własnej normy, nie samo zachowanie. Koty maskują ból — utrzymujący się spadek aktywności warto obserwować.",
    tags: ["activity", "general"],
  },
  {
    id: "activity-no-force",
    text: "Nagły spadek chęci do zabawy u wcześniej aktywnego kota? Nie nakłaniaj na siłę — to może być ból lub choroba. Rozważ wizytę u weterynarza.",
    tags: ["activity", "vet"],
  },
  {
    id: "appetite-context",
    text: "Zmiany apetytu czytaj w kontekście: nasilony apetyt i miauczenie bywają objawem nadczynności tarczycy lub cukrzycy. Najpierw wyklucz przyczyny medyczne.",
    tags: ["appetite", "vet"],
  },
  {
    id: "vet-red-flags",
    text: "Czerwone flagi do pilnej konsultacji: krew w kuwecie, brak moczu lub wyraźny wysiłek przy oddawaniu, brak jedzenia ponad dobę. Tu liczy się czas.",
    tags: ["vet", "appetite"],
  },

  /* --- ogólne / motywacyjne --- */
  {
    id: "general-observe",
    text: "Obserwuj z dystansu, zanim zaczniesz działać. Koty bywają neofobiczne — najpierw sprawdzają, czy nowość jest bezpieczna, dopiero potem reagują.",
    tags: ["general", "play-shy"],
  },
  {
    id: "general-consistency",
    text: "Konsekwencja bije intensywność. Codzienny mały rytuał działa lepiej niż okazjonalny wielki wysiłek — dla kota liczy się przewidywalność.",
    tags: ["general", "ritual"],
  },
];

/* =============================================================
   rankTips — dopasowanie porad do statystyk zachowań kota.
   Zwraca pełną listę porad: najpierw trafne dla bieżących
   sygnałów (przetasowane), potem reszta. Dzięki temu kliknięcie
   w poradę cyklicznie pokazuje kolejne, zaczynając od dopasowanych.
   ============================================================= */

function mode(arr: number[]): number | null {
  if (!arr.length) return null;
  const c: Record<number, number> = {};
  arr.forEach((v) => (c[v] = (c[v] || 0) + 1));
  return +Object.keys(c).reduce((a, b) => (c[+b] > c[+a] ? b : a));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function rankTips(logs: DayLog[]): Tip[] {
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1));
  const recent = sorted.slice(0, WIN);
  const vals = (k: keyof DayMetrics) =>
    recent.map((l) => l.m?.[k]).filter((v): v is number => v != null);

  const active = new Set<TipTag>();

  // zabawa: brak/krótko → porady o zabawie
  const zabawa = vals("zabawa");
  const zMode = mode(zabawa);
  if (zMode != null && zMode <= 1) {
    active.add("play");
    active.add("ritual");
  }

  // miauczenie: 3 nocne / 4 pod drzwiami / 5 o jedzenie → nawyk
  const vocal = vals("vocal");
  if (vocal.some((v) => v === 5)) active.add("begging");
  if (vocal.some((v) => v === 3 || v === 4)) {
    active.add("night");
    active.add("begging");
  }
  if (mode(vocal) === 2) active.add("begging"); // miauczy „więcej”

  // aktywność: brak/mało → activity
  const akt = vals("aktywnosc");
  const aMode = mode(akt);
  if (aMode != null && aMode <= 1) active.add("activity");

  // apetyt: cokolwiek innego niż „jak zwykle” → appetite
  const apetyt = vals("apetyt");
  if (apetyt.some((v) => v !== 1)) active.add("appetite");

  // brak danych / wszystko jak zwykle → ogólne + zabawa + rytuał
  if (active.size === 0) {
    active.add("play");
    active.add("ritual");
    active.add("general");
  }

  const matches = (t: Tip) => t.tags.some((tag) => active.has(tag));
  const relevant = shuffle(TIPS.filter(matches));
  const rest = shuffle(TIPS.filter((t) => !matches(t)));
  return [...relevant, ...rest];
}
