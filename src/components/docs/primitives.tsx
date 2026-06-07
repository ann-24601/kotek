/* =============================================================
   Kotek — prymitywy dokumentacji (/docs).
   Współdzielone przez zakładki API i MCP. Czysto prezentacyjne
   (bez hooków), styl „rysowane długopisem".
   ============================================================= */
import type { ReactNode } from "react";

/** Badge metody HTTP (POST = wypełniony, GET = obrys). */
export function Method({ verb }: { verb: "GET" | "POST" }) {
  return (
    <span
      className={
        verb === "POST"
          ? "inline-flex items-center rounded-[var(--r-chip)] bg-ink px-2.5 py-1 font-hand text-sm font-semibold text-paper"
          : "inline-flex items-center rounded-[var(--r-chip)] border-2 border-ink bg-paper px-2.5 py-1 font-hand text-sm font-semibold text-ink"
      }
    >
      {verb}
    </span>
  );
}

/** Badge ogólny (np. „tool", „MCP"). */
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[var(--r-chip)] border-2 border-ink bg-paper px-2.5 py-1 font-hand text-sm font-semibold text-ink">
      {children}
    </span>
  );
}

/** Blok kodu (sketch-box, przewijany poziomo). */
export function Code({ children }: { children: string }) {
  return (
    <pre className="scroll-sketch my-3 overflow-x-auto rounded-[var(--r-box)] border-2 border-ink bg-paper-2 p-4 text-[0.8125rem] leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

/** Wiersz opisu pola/parametru. */
export function Field({
  name,
  type,
  children,
}: {
  name: string;
  type: string;
  children: ReactNode;
}) {
  return (
    <li className="border-b border-hairline py-2 last:border-0">
      <code className="font-semibold">{name}</code>{" "}
      <span className="text-ink-faint">{type}</span>
      <div className="mt-0.5 text-ink-soft">{children}</div>
    </li>
  );
}
