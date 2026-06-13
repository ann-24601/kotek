/* =============================================================
   Kotek — behawiorysta AI: persona + serializacja kontekstu.
   Składa instrukcje agenta z profilu kota, profilu zabawy,
   filarów środowiska oraz wszystkich wpisów z dziennika.
   Wartości metryk tłumaczone na etykiety przez reużycie
   METRICS/PILLARS z constants.ts (bez hardkodowania).
   ============================================================= */

import { METRICS, PILLARS } from "./constants";
import { stripHtml } from "./html";
import type {
  CatProfile,
  DayLog,
  DayMetrics,
  Pillars,
  PlayProfile,
} from "./types";

/**
 * Wpis pobrany z wyszukiwania hybrydowego dla bieżącego pytania.
 * Strukturalnie zgodny z HybridSearchHit (server/search), ale zdefiniowany
 * lokalnie, żeby ten moduł nie wciągał kodu serwerowego.
 */
export interface RetrievedEntry {
  date: string;
  /** Notatka jako czysty tekst (HTML już oczyszczony przez hybridSearch). */
  note: string;
  metrics: DayMetrics;
}

export interface BehavioristContext {
  profile: CatProfile | null;
  playProfile: PlayProfile | null;
  pillars: Pillars;
  logs: DayLog[];
  /** Opcjonalny dzień do wyróżnienia jako główny kontekst pytania (YYYY-MM-DD). */
  focusDate?: string;
}

const SEX_LABEL: Record<CatProfile["sex"], string> = {
  kot: "kocur (samiec)",
  kotka: "kotka (samica)",
};

const HUNTING_LABEL: Record<PlayProfile["huntingStyle"], string> = {
  air: "powietrzny (ptaki — zabawki latające)",
  ground: "naziemny (gryzonie — zabawki przy podłodze)",
  mixed: "mieszany",
};

const TEMPERAMENT_LABEL: Record<PlayProfile["temperament"], string> = {
  confident: "pewny siebie",
  timid: "lękliwy/ostrożny",
  lowEnergy: "spokojny / mało energiczny",
};

const ENGAGEMENT_LABEL: Record<PlayProfile["engagement"], string> = {
  easy: "łatwo się angażuje w zabawę",
  hard: "trudno go zaangażować",
  none: "nie chce się bawić",
};

const NIGHT_LABEL: Record<NonNullable<PlayProfile["nightWaking"]>, string> = {
  yes: "tak, budzi w nocy",
  no: "nie budzi w nocy",
  unknown: "nie wiadomo",
};

function describeProfile(profile: CatProfile | null): string {
  if (!profile) return "Profil kota nie został jeszcze uzupełniony.";
  const lines = [
    `- Imię: ${profile.name}`,
    `- Płeć: ${SEX_LABEL[profile.sex]}`,
    `- Sterylizacja/kastracja: ${profile.neutered ? "tak" : "nie"}`,
    `- Tryb życia: ${profile.indoor === "domowy" ? "kot domowy (nie wychodzi)" : "wychodzący"}`,
    `- Inne zwierzęta w domu: ${profile.multi ? "tak" : "nie"}`,
  ];
  if (profile.notes) {
    const n = stripHtml(profile.notes);
    if (n) lines.push(`- Notatki opiekuna o kocie: ${n}`);
  }
  return lines.join("\n");
}

function describePlayProfile(play: PlayProfile | null): string {
  if (!play) return "Profil zabawy nie został jeszcze uzupełniony.";
  const lines = [
    `- Styl łowiecki: ${HUNTING_LABEL[play.huntingStyle]}`,
    `- Temperament: ${TEMPERAMENT_LABEL[play.temperament]}`,
    `- Zaangażowanie w zabawę: ${ENGAGEMENT_LABEL[play.engagement]}`,
  ];
  if (play.toyPrefs?.length) {
    lines.push(`- Ulubione zabawki: ${play.toyPrefs.join(", ")}`);
  }
  if (play.nightWaking) {
    lines.push(`- Budzenie w nocy: ${NIGHT_LABEL[play.nightWaking]}`);
  }
  if (play.learnedNotes) {
    lines.push(`- Dodatkowe obserwacje: ${play.learnedNotes}`);
  }
  return lines.join("\n");
}

function describePillars(pillars: Pillars): string {
  return PILLARS.map((p) => {
    const ok = pillars?.[p.key];
    return `- ${p.t}: ${ok ? "zapewnione ✓" : "BRAK / niepewne ✗"} (${p.d})`;
  }).join("\n");
}

/* zamienia liczbową wartość metryki na etykietę z constants */
function metricLabel(key: keyof DayLog["m"], value: number | undefined): string | null {
  const metric = METRICS.find((m) => m.key === key);
  if (!metric || value === undefined) return null;
  const opt = metric.options.find((o) => o.v === value);
  return `${metric.label}: ${opt ? opt.l : value}`;
}

function describeLogs(logs: DayLog[]): string {
  if (!logs.length) return "Brak wpisów w dzienniku.";
  // od najnowszych
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  return sorted
    .map((log) => {
      const metrics = (Object.keys(log.m) as (keyof DayLog["m"])[])
        .map((k) => metricLabel(k, log.m[k]))
        .filter(Boolean)
        .join(", ");
      const note = log.note ? stripHtml(log.note) : "";
      const parts = [`[${log.date}]`];
      if (metrics) parts.push(metrics);
      if (note) parts.push(`Notatka: ${note}`);
      return parts.join(" — ");
    })
    .join("\n");
}

const PERSONA = `Jesteś **Behawiorystą** — doświadczonym, ale ciepłym i pogodnym specjalistą od zachowania kotów (etologia kota).
Rozmawiasz z opiekunem konkretnego kota w aplikacji Kotek, która pomaga w codziennym rytuale kota (poluj → jedz → myj się → śpij).

TON:
- Bądź **konkretny, ale przyjazny i wesoły** — jak życzliwy ekspert, który lubi koty i kibicuje opiekunowi. Trochę lekkości i ciepła, ale bez przesady i bez infantylizowania.
- Mów po polsku. Imię kota odmieniaj zawsze w MIANOWNIKU (np. "Mruczek lubi…", nie "Mruczka").
- Czasem możesz wpleść drobny, sympatyczny akcent (np. krótki komplement dla kota), ale priorytetem jest treść.

FORMATOWANIE (Markdown — odpowiedź jest renderowana jako Markdown):
- Pisz w **Markdown**, dbając o czytelność: krótkie akapity oddzielone pustą linią.
- **Pogrubiaj** najważniejsze słowa i wnioski (np. nazwy zachowań, kluczowe zalecenia).
- Konkretne kroki podawaj jako **listę** (numerowaną dla kolejności, punktowaną dla zbioru porad).
- Możesz użyć krótkiego **nagłówka** (\`###\`) tylko gdy odpowiedź jest dłuższa i ma kilka sekcji.
- Nie przesadzaj z formatowaniem — ma ułatwiać czytanie, nie zaśmiecać.

TREŚĆ:
- Opieraj porady na danych z profilu i dziennika poniżej. Odwołuj się do konkretnych obserwacji opiekuna (daty, metryki, notatki), zamiast mówić ogólnikami.
- Dawaj praktyczne, wykonalne kroki dopasowane do tego kota (jego stylu łowieckiego, temperamentu, środowiska).
- NIE jesteś weterynarzem i nie diagnozujesz chorób. Gdy widzisz czerwoną flagę zdrowotną (np. apetyt "Mniej"/brak jedzenia, nagłe duże zmiany w aktywności, ukrywanie się, sygnały bólu) — wyraźnie zalecaj wizytę u weterynarza.
- Bądź zwięzły: kilka akapitów lub krótka lista kroków. Bez ścian tekstu.`;

/* opisuje pojedynczy wpis (metryki + notatka) lub brak wpisu */
function describeOneLog(log: DayLog | undefined): string {
  if (!log) return "Na ten dzień NIE MA jeszcze wpisu w dzienniku.";
  const metrics = (Object.keys(log.m) as (keyof DayLog["m"])[])
    .map((k) => metricLabel(k, log.m[k]))
    .filter(Boolean)
    .join(", ");
  const note = log.note ? stripHtml(log.note) : "";
  const parts: string[] = [];
  if (metrics) parts.push(metrics);
  if (note) parts.push(`Notatka: ${note}`);
  return parts.length ? parts.join(" — ") : "Wpis istnieje, ale bez metryk i notatki.";
}

/* opisuje wpisy pobrane wyszukiwaniem hybrydowym dla bieżącego pytania */
function describeRetrieved(entries: RetrievedEntry[]): string {
  if (!entries.length) {
    return `
=== NAJTRAFNIEJSZE WPISY (wyszukiwanie hybrydowe) ===
Wyszukiwanie nie zwróciło wpisów pasujących do tego pytania. Oprzyj odpowiedź na pełnym dzienniku powyżej, a jeśli brakuje danych — powiedz to wprost.
`;
  }
  const body = entries
    .map((e) => {
      const metrics = (Object.keys(e.metrics) as (keyof DayMetrics)[])
        .map((k) => metricLabel(k, e.metrics[k]))
        .filter(Boolean)
        .join(", ");
      const note = e.note ? stripHtml(e.note) : "";
      const parts = [`[${e.date}]`];
      if (metrics) parts.push(metrics);
      if (note) parts.push(`Notatka: ${note}`);
      return parts.join(" — ");
    })
    .join("\n");
  return `
=== NAJTRAFNIEJSZE WPISY (wyszukiwanie hybrydowe dla tego pytania) ===
To wpisy wybrane automatycznie jako najbardziej pasujące do ostatniego pytania opiekuna (znaczenie + słowa kluczowe), uszeregowane od najtrafniejszych.
Oprzyj odpowiedź PRZEDE WSZYSTKIM na tych wpisach — cytuj konkretne daty, metryki i obserwacje. Pełny dziennik powyżej traktuj jako tło. Jeśli te wpisy nie wystarczają, możesz doszukać dodatkowych narzędziem search_diary.
${body}
`;
}

function describeFocus(ctx: BehavioristContext): string {
  if (!ctx.focusDate) return "";
  const log = ctx.logs.find((l) => l.date === ctx.focusDate);
  return `
=== DZIEŃ W CENTRUM UWAGI (${ctx.focusDate}) ===
Pytanie opiekuna dotyczy przede wszystkim tego dnia — potraktuj go priorytetowo, ale korzystaj też z pełnego kontekstu powyżej.
${describeOneLog(log)}
`;
}

export function buildInstructions(
  ctx: BehavioristContext,
  retrieved?: RetrievedEntry[],
): string {
  const catName = ctx.profile?.name ?? "kot";
  const retrievedBlock = retrieved ? describeRetrieved(retrieved) : "";
  return `${PERSONA}

=== PROFIL KOTA (${catName}) ===
${describeProfile(ctx.profile)}

=== PROFIL ZABAWY ===
${describePlayProfile(ctx.playProfile)}

=== ŚRODOWISKO (5 filarów dobrostanu) ===
${describePillars(ctx.pillars)}

=== DZIENNIK — WSZYSTKIE WPISY (od najnowszych) ===
${describeLogs(ctx.logs)}
${describeFocus(ctx)}${retrievedBlock}
Korzystaj z powyższych danych, odpowiadając na pytania opiekuna.`;
}
