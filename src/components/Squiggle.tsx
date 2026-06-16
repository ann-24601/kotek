/* =============================================================
   Kotek — krzywa, „odręczna" linia. Zastępuje proste <hr>/border-y
   oraz służy jako podkreślenie nagłówków. Rozciąga się na 100%
   szerokości; filtr url(#rough-line) dokłada drżenie długopisu.
   ============================================================= */

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface SquiggleProps {
  className?: string;
  style?: CSSProperties;
  /** grubość kreski */
  strokeWidth?: number;
  /** kolor (domyślnie kreska atramentowa, przygaszona) */
  tone?: "ink" | "soft" | "faint";
  /** wysokość pola rysunku w px (amplituda fali) */
  height?: number;
}

const TONE: Record<NonNullable<SquiggleProps["tone"]>, string> = {
  ink: "var(--ink)",
  soft: "var(--ink-soft)",
  faint: "var(--hairline)",
};

export function Squiggle({
  className,
  style,
  strokeWidth = 2,
  tone = "faint",
  height = 8,
}: SquiggleProps) {
  return (
    <svg
      className={cn("block w-full", className)}
      style={style}
      height={height}
      viewBox="0 0 300 8"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1 4 q 12 -4 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0"
        stroke={TONE[tone]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className="rough-line"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* krótkie podkreślenie pod nagłówkiem (ograniczona szerokość) */
export function HandUnderline({
  className,
  width = 120,
  tone = "ink",
}: {
  className?: string;
  width?: number;
  tone?: SquiggleProps["tone"];
}) {
  return (
    <Squiggle
      tone={tone}
      strokeWidth={2.4}
      height={9}
      className={className}
      style={{ width, maxWidth: "60%" }}
    />
  );
}
