/* =============================================================
   Kotek — stałe domenowe
   Obserwacja ograniczona do sygnałów NIEOCZYWISTYCH (PRD 8.6):
   kuweta, wokalizacja, pielęgnacja, kontakt z domem, nastrój.
   Apetyt i "zabawa jako alarm" świadomie usunięte.
   ============================================================= */

import type { IconName } from "../components/Icon";

export interface MetricOption {
  v: number;
  l: string;
}

export interface Metric {
  key: keyof import("./types").DayMetrics;
  label: string;
  icon: IconName;
  /** wartość typowa / "jak zwykle" */
  normal: number;
  /** kierunek niepokoju */
  concern: "low" | "high" | "both";
  /** wartości będące czerwoną flagą (np. „Nie je") */
  red?: number[];
  options: MetricOption[];
}

export const METRICS: Metric[] = [
  {
    key: "aktywnosc",
    label: "Aktywność",
    icon: "paw",
    normal: 2,
    concern: "low",
    options: [
      { v: 0, l: "Brak" },
      { v: 1, l: "Mało" },
      { v: 2, l: "Jak zwykle" },
      { v: 3, l: "Dużo" },
    ],
  },
  {
    key: "apetyt",
    label: "Apetyt",
    icon: "bowl",
    normal: 1,
    concern: "both",
    options: [
      { v: 0, l: "Mniej" },
      { v: 1, l: "Jak zwykle" },
      { v: 2, l: "Więcej" },
    ],
  },
  {
    key: "vocal",
    label: "Miauczenie",
    icon: "vocal",
    normal: 1,
    concern: "high",
    options: [
      { v: 0, l: "Mniej" },
      { v: 1, l: "Jak zwykle" },
      { v: 2, l: "Więcej" },
      { v: 3, l: "Nocne" },
      { v: 4, l: "Pod drzwiami" },
      { v: 5, l: "O jedzenie" },
    ],
  },
  {
    key: "zabawa",
    label: "Zabawa",
    icon: "feather",
    normal: 2,
    concern: "low",
    options: [
      { v: 0, l: "Brak" },
      { v: 1, l: "Krótko" },
      { v: 2, l: "Dobra sesja" },
    ],
  },
];

export interface Pillar {
  key: string;
  t: string;
  d: string;
  icon: IconName;
}

export const PILLARS: Pillar[] = [
  {
    key: "p1",
    t: "Bezpieczne kryjówki",
    d: "Miejsca, gdzie kot może się schować i odpocząć — najlepiej wyżej.",
    icon: "house",
  },
  {
    key: "p2",
    t: "Rozdzielone zasoby",
    d: "Miska, woda, kuweta, drapak, legowiska — osobno i w kilku miejscach.",
    icon: "bowl",
  },
  {
    key: "p3",
    t: "Zabawa łowiecka",
    d: "Codzienna zabawa naśladująca polowanie (wędka, podchody).",
    icon: "feather",
  },
  {
    key: "p4",
    t: "Przewidywalny kontakt",
    d: "Spójne, łagodne interakcje — bez zmuszania do kontaktu.",
    icon: "paw",
  },
  {
    key: "p5",
    t: "Szacunek dla węchu",
    d: "Bez intensywnych zapachów; nie myć wszystkich legowisk naraz.",
    icon: "nose",
  },
];

/* awatary kota — klucze hand-drawn ikon */
export const AVATARS: IconName[] = ["cat", "catBlack", "catSit", "catLoaf", "kitten"];

export const MIN_DAYS = 7; // minimum dni, by ustalić normę
export const WIN = 7; // okno "ostatnich dni"
