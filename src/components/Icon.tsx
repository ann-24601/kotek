/* =============================================================
   Kotek — biblioteka ikon "rysowanych długopisem"
   Wszystkie ikony: czarny kontur (currentColor), białe wnętrze,
   celowo lekko nierówne linie, ale czytelne. viewBox 0 0 24 24.
   Dekoracyjne domyślnie (aria-hidden); podaj `title`, by nadać
   znaczenie dla czytników ekranu.
   ============================================================= */

import type { CSSProperties } from "react";

export type IconName =
  | "cat"
  | "catBlack"
  | "catSit"
  | "catLoaf"
  | "kitten"
  | "feather"
  | "bowl"
  | "litter"
  | "sleep"
  | "grooming"
  | "vocal"
  | "social"
  | "mood"
  | "nose"
  | "house"
  | "paw"
  | "warn"
  | "today"
  | "chat"
  | "settings"
  | "arrowRight"
  | "check"
  | "plus"
  | "close"
  | "edit"
  | "send"
  | "clock"
  | "sparkle"
  | "stats"
  | "yarn"
  | "sort";

interface IconProps {
  name: IconName;
  size?: number;
  /** Tekst dla czytnika ekranu; bez niego ikona jest dekoracyjna. */
  title?: string;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}

const PATHS: Record<IconName, JSX.Element> = {
  // --- awatary kota ---
  cat: (
    <g fill="none">
      <path d="M5 9 L4 4 L8.5 7" />
      <path d="M19 9 L20 4 L15.5 7" />
      <path d="M5 9 C4 14 6 20 12 20 C18 20 20 14 19 9 C18 6 15 5 12 5 C9 5 6 6 5 9 Z" />
      <path d="M9.3 12 h0.01" strokeWidth={2.6} />
      <path d="M14.7 12 h0.01" strokeWidth={2.6} />
      <path d="M12 14 l-1 1.2 h2 Z" />
      <path d="M3 13 h4 M3 15 h3.6" />
      <path d="M21 13 h-4 M21 15 h-3.6" />
    </g>
  ),
  catBlack: (
    <g>
      <path
        d="M5 9 L4 4 L8.5 7 M19 9 L20 4 L15.5 7 M5 9 C4 14 6 20 12 20 C18 20 20 14 19 9 C18 6 15 5 12 5 C9 5 6 6 5 9 Z"
        fill="currentColor"
        stroke="currentColor"
      />
      <circle cx="9.3" cy="12" r="0.9" fill="var(--paper)" stroke="none" />
      <circle cx="14.7" cy="12" r="0.9" fill="var(--paper)" stroke="none" />
    </g>
  ),
  catSit: (
    <g fill="none">
      <path d="M8 7 L7 3 L10 5.5" />
      <path d="M14 7 L15 3 L12 5.5" />
      <path d="M8 7 C6.5 9 6.5 11 7.5 12.5 C6 14 5.5 17 6.5 20 L16 20 C16.5 16 16 9 14 7 C12.5 5.8 9.5 5.8 8 7 Z" />
      <path d="M16 20 C19 19 20 16 18.5 13.5" />
      <path d="M9.6 9.4 h0.01" strokeWidth={2.4} />
      <path d="M12.4 9.4 h0.01" strokeWidth={2.4} />
    </g>
  ),
  catLoaf: (
    <g fill="none">
      <path d="M6 8 L5 4.5 L8 6.5 M13 8 L14 4.5 L11 6.5" />
      <path d="M4 17 C3.5 11 7 8 10 8 C16 8 20 11 20.5 16 C20.7 17.5 20 18 19 18 L5 18 C4.2 18 4 17.6 4 17 Z" />
      <path d="M7.5 12 h0.01" strokeWidth={2.4} />
      <path d="M11 12 h0.01" strokeWidth={2.4} />
      <path d="M4 18 c2 1 13 1 16 0" />
    </g>
  ),
  kitten: (
    <g fill="none">
      <path d="M7 11 L6.3 7.5 L9 9.5 M15 11 L15.7 7.5 L13 9.5" />
      <path d="M7 11 C6.5 15 8 19 12 19 C16 19 17.5 15 17 11 C16.3 8.5 14 7.5 12 7.5 C10 7.5 7.7 8.5 7 11 Z" />
      <path d="M10 13 h0.01" strokeWidth={2.4} />
      <path d="M14 13 h0.01" strokeWidth={2.4} />
      <path d="M12 14.6 l-0.7 0.8 h1.4 Z" />
    </g>
  ),

  // --- rytuał / konteksty ---
  feather: (
    <g fill="none">
      <path d="M19 4 C13 5 8 9 5.5 15 C5 16 4.5 17.5 4 19" />
      <path d="M19 4 C19.5 8 18 12 14.5 14.5 C12 16.2 9 16.8 6.5 16" />
      <path d="M16.5 6.5 C14 7 12 8.5 11 11" />
      <path d="M4 19 L3 21" />
    </g>
  ),
  bowl: (
    <g fill="none">
      <path d="M3.5 11 C3.5 16 7 19 12 19 C17 19 20.5 16 20.5 11 Z" />
      <path d="M2.5 11 h19" />
      <path d="M9 8.5 c0 -1.5 1.5 -2.5 3 -2.5 s3 1 3 2.5" />
      <path d="M8 14 h0.01 M12 15 h0.01 M16 14 h0.01" strokeWidth={2.4} />
    </g>
  ),
  litter: (
    <g fill="none">
      <path d="M4 9 L5.5 19 C5.6 19.6 6 20 6.6 20 L17.4 20 C18 20 18.4 19.6 18.5 19 L20 9 Z" />
      <path d="M3 9 h18" />
      <path d="M9 13 l1.5 1.5 M15 13 l-1.5 1.5 M12 14 l0 2" />
      <path d="M16.5 5 l2.5 -1 0.6 2" />
    </g>
  ),
  sleep: (
    <g fill="none">
      <path d="M20 14 C19 17.5 15.5 20 12 19.5 C8 19 5 15.5 5.5 11.5 C6 8 8.5 5.5 12 5.5 C9.5 8 9.5 12 12 14 C14 15.5 17 15.5 20 14 Z" />
      <path d="M14.5 5 h3 l-3 3 h3" strokeWidth={1.4} />
    </g>
  ),
  grooming: (
    <g fill="none">
      <path d="M14 3 L21 10 L18 13 L11 6 Z" />
      <path d="M11 6 L4 13 C3 14 3 16 4.5 17.5 C6 19 8 19 9 18 L16 11" />
      <path d="M5.5 14.5 v3 M8 14 v3.5 M10.5 13.5 v3" strokeWidth={1.4} />
    </g>
  ),
  vocal: (
    <g fill="none">
      <path d="M3 7 C3 5.5 4 4.5 5.5 4.5 L13 4.5 C14.5 4.5 15.5 5.5 15.5 7 L15.5 11 C15.5 12.5 14.5 13.5 13 13.5 L8 13.5 L4.5 17 L4.5 13.5 C3.5 13 3 12 3 11 Z" />
      <path d="M18 8 c2 1 2 4 0 6" />
      <path d="M20.5 6 c3 2.5 3 7 0 10" />
      <path d="M6.5 9 h6 M6.5 11 h4" strokeWidth={1.3} />
    </g>
  ),
  social: (
    <g fill="none">
      <path d="M12 13 C9.5 13 7.5 15 7.5 17.5 C7.5 19 9 19.5 12 19.5 C15 19.5 16.5 19 16.5 17.5 C16.5 15 14.5 13 12 13 Z" />
      <circle cx="7" cy="9.5" r="1.6" />
      <circle cx="11" cy="7" r="1.6" />
      <circle cx="15" cy="7" r="1.6" />
      <circle cx="18" cy="10" r="1.6" />
    </g>
  ),
  mood: (
    <g fill="none">
      <path d="M5 9 L4 4.5 L8 7 M19 9 L20 4.5 L16 7" />
      <path d="M5 9 C4 14 6 20 12 20 C18 20 20 14 19 9 C18 6.5 15 5.5 12 5.5 C9 5.5 6 6.5 5 9 Z" />
      <path d="M9 12 q0.8 -1 1.6 0 M13.4 12 q0.8 -1 1.6 0" />
      <path d="M10 16 q2 1.5 4 0" />
    </g>
  ),
  nose: (
    <g fill="none">
      <path d="M9 8 L15 8 L12 12 Z" />
      <path d="M12 12 v3" />
      <path d="M12 15 q-2 1.5 -4 0.5 M12 15 q2 1.5 4 0.5" />
      <path d="M3 9 h4 M3 11 h3.4 M21 9 h-4 M21 11 h-3.4" strokeWidth={1.3} />
    </g>
  ),
  house: (
    <g fill="none">
      <path d="M4 11 L12 4 L20 11" />
      <path d="M6 10 L6 19 C6 19.6 6.4 20 7 20 L17 20 C17.6 20 18 19.6 18 19 L18 10" />
      <circle cx="12" cy="14" r="2.4" />
    </g>
  ),
  paw: (
    <g fill="none">
      <path d="M12 13 C9.5 13 7.5 15.5 7.5 18 C7.5 19.4 9 20 12 20 C15 20 16.5 19.4 16.5 18 C16.5 15.5 14.5 13 12 13 Z" />
      <ellipse cx="7.5" cy="10" rx="1.5" ry="2" />
      <ellipse cx="11" cy="8" rx="1.5" ry="2" />
      <ellipse cx="15" cy="8" rx="1.5" ry="2" />
      <ellipse cx="18.5" cy="10.5" rx="1.5" ry="2" />
    </g>
  ),
  warn: (
    <g fill="none">
      <path d="M12 3.5 L21 19 C21.4 19.7 21 20.5 20 20.5 L4 20.5 C3 20.5 2.6 19.7 3 19 Z" />
      <path d="M12 9 V14" strokeWidth={2.2} />
      <path d="M12 17 h0.01" strokeWidth={2.6} />
    </g>
  ),

  // --- nawigacja / akcje ---
  today: (
    <g fill="none">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3 V5.5 M12 18.5 V21 M3 12 H5.5 M18.5 12 H21 M5.5 5.5 L7.3 7.3 M16.7 16.7 L18.5 18.5 M18.5 5.5 L16.7 7.3 M7.3 16.7 L5.5 18.5" />
    </g>
  ),
  chat: (
    <g fill="none">
      <path d="M3.5 7 C3.5 5.5 4.5 4.5 6 4.5 L18 4.5 C19.5 4.5 20.5 5.5 20.5 7 L20.5 13 C20.5 14.5 19.5 15.5 18 15.5 L9 15.5 L5 19.5 L5 15.5 C4 15 3.5 14 3.5 13 Z" />
      <path d="M8 9 L7 6 L10 8 M16 9 L17 6 L14 8" strokeWidth={1.3} />
      <path d="M9.5 11 h0.01 M14.5 11 h0.01" strokeWidth={2.2} />
      <path d="M10.5 12.5 q1.5 1 3 0" strokeWidth={1.3} />
    </g>
  ),
  settings: (
    <g fill="none">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3 l1.2 2.4 2.6 -0.6 0.2 2.7 2.6 0.9 -1.4 2.3 1.4 2.3 -2.6 0.9 -0.2 2.7 -2.6 -0.6 -1.2 2.4 -1.2 -2.4 -2.6 0.6 -0.2 -2.7 -2.6 -0.9 1.4 -2.3 -1.4 -2.3 2.6 -0.9 0.2 -2.7 2.6 0.6 Z" />
    </g>
  ),
  arrowRight: (
    <g fill="none">
      <path d="M4 12 H20" />
      <path d="M14 6 L20 12 L14 18" />
    </g>
  ),
  check: (
    <g fill="none">
      <path d="M4 13 L9 18 L20 5" strokeWidth={2.4} />
    </g>
  ),
  plus: (
    <g fill="none">
      <path d="M12 4 V20 M4 12 H20" strokeWidth={2.2} />
    </g>
  ),
  close: (
    <g fill="none">
      <path d="M5 5 L19 19 M19 5 L5 19" strokeWidth={2.2} />
    </g>
  ),
  edit: (
    <g fill="none">
      <path d="M15 4 L20 9 L9 20 L4 20 L4 15 Z" />
      <path d="M13 6 L18 11" />
    </g>
  ),
  send: (
    <g fill="none">
      <path d="M4 12 L20 4 L14 20 L11 13 Z" />
      <path d="M11 13 L20 4" />
    </g>
  ),
  clock: (
    <g fill="none">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7 V12 L15.5 14" />
    </g>
  ),
  sparkle: (
    <g fill="none">
      <path d="M12 3 C12.5 8 14 10 19 11 C14 12 12.5 14 12 19 C11.5 14 10 12 5 11 C10 10 11.5 8 12 3 Z" />
    </g>
  ),
  stats: (
    <g fill="none">
      <path d="M4 4 V19 C4 19.6 4.4 20 5 20 H20" />
      <path d="M7 16 L11 11 L14 14 L20 6.5" />
      <path d="M20 10 V6.5 H16.5" strokeWidth={1.4} />
    </g>
  ),
  yarn: (
    <g fill="none">
      <circle cx="12" cy="12" r="8" />
      <path d="M6 9 C10 11 14 13 18 15 M5 13 C9 11 15 13 19 11 M8 5.5 C10 10 14 14 16 18.5" strokeWidth={1.3} />
    </g>
  ),
  sort: (
    <g fill="none">
      <path d="M8 19 V5" />
      <path d="M5 8 L8 5 L11 8" />
      <path d="M16 5 V19" />
      <path d="M13 16 L16 19 L19 16" />
    </g>
  ),
};

export function Icon({
  name,
  size = 24,
  title,
  className,
  style,
  strokeWidth = 1.8,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
