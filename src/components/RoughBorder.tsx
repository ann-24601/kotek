"use client";

/* =============================================================
   Kotek — „krzywa" obwódka jako PRAWDZIWA ścieżka SVG (nie filtr).
   Rysujemy zaokrąglony prostokąt, próbkujemy jego obwód i przesuwamy
   każdy punkt wzdłuż normalnej o gładki, nieregularny szum. Efekt:
   ciągła linia o STAŁEJ grubości z gęstą, nieregularną falą — jak
   Dynamic stroke w Figmie (Frequency = gęstość fal, Wiggle = amplituda,
   Smoothen = wygładzenie). Rozmiar mierzymy ResizeObserverem, więc
   działa na dowolnie dużym elemencie.
   ============================================================= */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* deterministyczny RNG (mulberry32) — stabilny wzór na instancję */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), s | 1) + 1013904223) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 7), t | 61);
    t ^= t + Math.imul(t ^ (t >>> 13), t | 7);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Seg {
  len: number;
  at: (t: number) => [number, number, number, number]; // x, y, nx, ny (normalna na zewnątrz)
}

/** ścieżka „d" falistego zaokrąglonego prostokąta o stałej grubości linii */
function wavyRoundRect(
  w: number,
  h: number,
  radius: number,
  wavelength: number,
  amplitude: number,
  seed: number,
): string {
  const r = Math.max(0, Math.min(radius, Math.min(w, h) / 2 - 1));
  const HALF = Math.PI / 2;
  const segs: Seg[] = [];

  const line = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    segs.push({
      len,
      at: (t) => {
        const k = len ? t / len : 0;
        return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, nx, ny];
      },
    });
  };
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    const len = Math.abs(a1 - a0) * r;
    segs.push({
      len,
      at: (t) => {
        const a = a0 + (a1 - a0) * (len ? t / len : 0);
        const nx = Math.cos(a);
        const ny = Math.sin(a);
        return [cx + r * nx, cy + r * ny, nx, ny];
      },
    });
  };

  // obwód zgodnie z ruchem wskazówek zegara
  line(r, 0, w - r, 0, 0, -1); // góra
  arc(w - r, r, -HALF, 0); // róg PG
  line(w, r, w, h - r, 1, 0); // prawa
  arc(w - r, h - r, 0, HALF); // róg PD
  line(w - r, h, r, h, 0, 1); // dół
  arc(r, h - r, HALF, Math.PI); // róg LD
  line(0, h - r, 0, r, -1, 0); // lewa
  arc(r, r, Math.PI, Math.PI * 1.5); // róg LG

  const P = segs.reduce((s, x) => s + x.len, 0);
  if (P < 8) return "";

  // węzły szumu rozmieszczone równo po obwodzie → bezszwowe zawinięcie
  const N = Math.max(8, Math.round(P / wavelength));
  const rand = rng(seed);
  const nodes = Array.from({ length: N }, () => rand() * 2 - 1);
  const noiseAt = (arcLen: number) => {
    const f = (arcLen / P) * N;
    const i = ((Math.floor(f) % N) + N) % N;
    const frac = f - Math.floor(f);
    const a = nodes[i];
    const b = nodes[(i + 1) % N];
    const s = frac * frac * (3 - 2 * frac); // smoothstep = „Smoothen"
    return a + (b - a) * s;
  };

  const step = 2.5;
  const pts: string[] = [];
  let acc = 0;
  for (const seg of segs) {
    const n = Math.max(1, Math.round(seg.len / step));
    for (let i = 0; i < n; i++) {
      const t = (i / n) * seg.len;
      const [x, y, nx, ny] = seg.at(t);
      const off = amplitude * noiseAt(acc + t);
      pts.push(`${(x + nx * off).toFixed(1)} ${(y + ny * off).toFixed(1)}`);
    }
    acc += seg.len;
  }
  return `M${pts.join("L")}Z`;
}

export interface RoughBorderProps {
  /** promień zaokrąglenia (px) */
  radius?: number;
  /** grubość linii (stała) */
  strokeWidth?: number;
  /** średnia długość fali (mniej = gęstsze fale = wyższe „Frequency") */
  wavelength?: number;
  /** amplituda wygięcia („Wiggle") */
  amplitude?: number;
  /** kolor (domyślnie atrament) */
  color?: string;
  /** stały seed (opcjonalnie) — inaczej losowy raz na instancję */
  seed?: number;
  className?: string;
}

/**
 * Nakładka rysująca „krzywą" obwódkę rodzica. Rodzic musi być `relative`.
 * Zastępuje klasę `ink-edge` (usuń ją, gdy używasz RoughBorder).
 */
export function RoughBorder({
  radius = 14,
  strokeWidth = 2.5,
  wavelength = 22,
  amplitude = 2.4,
  color = "var(--ink)",
  seed,
  className,
}: RoughBorderProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const seedRef = useRef<number>(seed ?? Math.floor(Math.random() * 1e9));
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const b = el.getBoundingClientRect();
      setSize((s) =>
        Math.abs(s.w - b.width) < 0.5 && Math.abs(s.h - b.height) < 0.5
          ? s
          : { w: b.width, h: b.height },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const d =
    size.w > 4 && size.h > 4
      ? wavyRoundRect(size.w, size.h, radius, wavelength, amplitude, seedRef.current)
      : "";

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 block", className)}
    >
      {d && (
        <svg
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="absolute inset-0 overflow-visible"
          fill="none"
        >
          <path
            d={d}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}
