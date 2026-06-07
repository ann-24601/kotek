/* =============================================================
   Kotek — wspólny pasek tokenu (dokumentacja).
   Pole, w które użytkownik wkleja swój KOTEK_API_TOKEN; jest on
   podstawiany do przykładów w OBU zakładkach. Token żyje tylko
   w pamięci klienta — nie jest nigdzie wysyłany ani zapisywany.
   ============================================================= */
"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

export function TokenBar({
  token,
  onChange,
}: {
  token: string;
  onChange: (value: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard niedostępny — ignorujemy */
    }
  }

  return (
    <div className="flex w-full items-center gap-2 lg:w-auto">
      <label htmlFor="token-input" className="sr-only">
        Twój token API
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--r-chip)] border-2 border-ink bg-paper px-3 py-1.5 lg:w-[320px] lg:flex-none">
        <Icon name="note" size={18} className="shrink-0 text-ink-faint" />
        <input
          id="token-input"
          type="password"
          value={token}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Wklej swój KOTEK_API_TOKEN"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-ink outline-none placeholder:text-ink-faint"
        />
      </div>
      <button
        type="button"
        onClick={copy}
        disabled={!token}
        className="shrink-0 rounded-[var(--r-chip)] border-2 border-ink bg-paper px-3 py-1.5 font-hand text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-paper disabled:hover:text-ink"
        aria-label="Kopiuj token"
      >
        {copied ? "Skopiowano" : "Kopiuj"}
      </button>
    </div>
  );
}
