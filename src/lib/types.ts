/* =============================================================
   Kotek — typy domenowe (model danych z PRD, sekcja 9)
   ============================================================= */

export type Sex = "kot" | "kotka";
export type LifeMode = "domowy" | "wychodzący";

export interface CatProfile {
  name: string;
  /** Awatar wybierany z hand-drawn ikon (klucz ikony). */
  avatar: string;
  sex: Sex;
  /** Czy kot jest po sterylizacji/kastracji. */
  neutered: boolean;
  indoor: LifeMode;
  multi: boolean;
  notes?: string;
}

export type Pillars = Record<string, boolean>;

/* --- profil zabawy (PRD 8.3) --- */
export type HuntingStyle = "air" | "ground" | "mixed";
export type Temperament = "confident" | "timid" | "lowEnergy";
export type Engagement = "easy" | "hard" | "none";

export interface PlayProfile {
  huntingStyle: HuntingStyle;
  toyPrefs: string[];
  temperament: Temperament;
  engagement: Engagement;
  learnedNotes?: string;
  /** Czy kot budzi w nocy — dostraja wieczorny rytuał. */
  nightWaking?: "yes" | "no" | "unknown";
}

/* --- dziennik dnia --- */
export interface DayMetrics {
  aktywnosc?: number;
  apetyt?: number;
  vocal?: number;
  zabawa?: number;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  m: DayMetrics;
  note?: string;
  /** Ścieżki (klucze) zdjęć w buckecie Storage `day-photos`. */
  photos?: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
