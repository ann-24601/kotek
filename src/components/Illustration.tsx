/* =============================================================
   Kotek — duże ręczne ilustracje i ozdobniki „brzydkiego rysunku".
   Czarny kontur (currentColor), celowo krzywe linie. Filtr url(#rough*)
   dokłada odręczne „drżenie". Spójne z biblioteką Icon.
   ============================================================= */

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface IllProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** tekst dla czytnika; bez niego ilustracja jest dekoracyjna */
  title?: string;
}

/* --- 4-ramienna gwiazdka / błysk (jak w Broken Swords) --- */
export function Sparkle({ size = 24, className, style }: IllProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2 C12.7 8.2 15.8 11.3 22 12 C15.8 12.7 12.7 15.8 12 22 C11.3 15.8 8.2 12.7 2 12 C8.2 11.3 11.3 8.2 12 2 Z" />
    </svg>
  );
}

/* --- duży kot „hero" (powitanie / logowanie) --- */
export function CatHero({ size = 220, className, style, title }: IllProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 230"
      className={cn("text-ink", className)}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}

      {/* błyski wokół (poza filtrem, by zostały „gwiazdkowe") */}
      <g fill="currentColor" stroke="currentColor" strokeWidth={1}>
        <path d="M30 40 C31 45 33 47 38 48 C33 49 31 51 30 56 C29 51 27 49 22 48 C27 47 29 45 30 40 Z" />
        <path d="M192 64 C193 68 195 70 199 71 C195 72 193 74 192 78 C191 74 189 72 185 71 C189 70 191 68 192 64 Z" />
        <path d="M183 28 C183.6 31 185 32.4 188 33 C185 33.6 183.6 35 183 38 C182.4 35 181 33.6 178 33 C181 32.4 182.4 31 183 28 Z" />
      </g>

      {/* kot — całość lekko „drżąca" */}
      <g className="rough-fx">
        {/* uszy */}
        <path d="M64 78 L56 36 L92 64" />
        <path d="M156 78 L164 36 L128 64" />
        {/* wnętrze uszu */}
        <path d="M70 64 L66 46 L82 60" strokeWidth={1.6} />
        <path d="M150 64 L154 46 L138 60" strokeWidth={1.6} />
        {/* głowa */}
        <path d="M62 86 C56 116 70 140 110 140 C150 140 164 116 158 86 C153 60 134 50 110 50 C86 50 67 60 62 86 Z" />
        {/* oczy (nierówne) */}
        <path d="M90 92 h0.1" strokeWidth={7} />
        <path d="M132 89 h0.1" strokeWidth={7} />
        {/* nosek */}
        <path d="M104 104 L118 104 L111 112 Z" fill="currentColor" />
        {/* pyszczek */}
        <path d="M111 112 V118" />
        <path d="M111 118 q-9 7 -18 1" />
        <path d="M111 118 q9 7 18 1" />
        {/* wąsy */}
        <path d="M60 100 q-24 -3 -42 -9" strokeWidth={1.6} />
        <path d="M58 110 q-26 1 -44 1" strokeWidth={1.6} />
        <path d="M162 100 q24 -3 42 -9" strokeWidth={1.6} />
        <path d="M164 110 q26 1 44 1" strokeWidth={1.6} />
        {/* tułów (siedzący) */}
        <path d="M70 140 C54 168 56 206 66 212 L154 212 C164 206 166 168 150 140" />
        {/* łapki przednie */}
        <path d="M78 212 c0 -14 22 -14 22 0" />
        <path d="M120 212 c0 -14 22 -14 22 0" />
        <path d="M85 212 v-8 M92 212 v-9 M127 212 v-8 M134 212 v-9" strokeWidth={1.5} />
        {/* ogon owinięty z prawej */}
        <path d="M150 200 c34 -2 44 -42 18 -60 c-14 -10 -30 0 -28 14" />
      </g>
    </svg>
  );
}

/* --- mniejszy zwinięty / śpiący kot (puste stany) --- */
export function CatEmpty({ size = 150, className, style, title }: IllProps) {
  return (
    <svg
      width={size}
      height={(size * 120) / 180}
      viewBox="0 0 180 120"
      className={cn("text-ink", className)}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {/* Zzz */}
      <g stroke="currentColor" strokeWidth={1.6}>
        <path d="M120 30 h12 l-12 14 h12" />
        <path d="M138 16 h9 l-9 10 h9" strokeWidth={1.3} />
      </g>
      <g className="rough-fx">
        {/* zwinięte ciało */}
        <path d="M20 96 C8 70 30 50 60 50 C104 50 150 56 162 84 C168 98 158 100 150 100 L30 100 C22 100 22 99 20 96 Z" />
        {/* ogon owinięty */}
        <path d="M150 98 c20 -2 24 -22 8 -30 c-10 -5 -20 1 -18 10" />
        {/* głowa wtulona z lewej */}
        <path d="M58 96 C40 96 34 74 48 64 C58 57 74 60 78 72" />
        {/* uszko */}
        <path d="M50 66 L47 52 L62 62" />
        {/* zamknięte oczko + pyszczek */}
        <path d="M52 80 q5 4 10 0" strokeWidth={1.6} />
        <path d="M44 84 q-12 -1 -20 -4" strokeWidth={1.3} />
      </g>
    </svg>
  );
}
