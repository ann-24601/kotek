/* =============================================================
   Kotek — zarządzanie osobistymi tokenami API (na /docs).
   Dla zalogowanych: generowanie (token widoczny RAZ), lista i
   odwoływanie tokenów. Dla niezalogowanych: zwykłe pole na
   wklejenie tokenu. Wybrany/wygenerowany token zasila przykłady
   API/MCP przez wspólny stan (onChange).
   ============================================================= */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { TokenBar } from "./TokenBar";

interface TokenRow {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" }) : "—";

export function TokenManager({
  token,
  onChange,
}: {
  token: string;
  onChange: (value: string) => void;
}) {
  const { user, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<string | null>(null); // pełny token pokazany raz
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const authHeader = useCallback(
    () => ({ Authorization: `Bearer ${session?.access_token ?? ""}` }),
    [session],
  );

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/tokens", { headers: authHeader() });
      const data = (await res.json()) as { tokens?: TokenRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Błąd pobierania");
      setTokens(data.tokens ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd pobierania tokenów.");
    }
  }, [session, authHeader]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  async function generate() {
    if (!session || busy) return;
    setBusy(true);
    setError(null);
    setFresh(null);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ name: name.trim() || "Token" }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) throw new Error(data.error ?? "Nie udało się wygenerować tokenu.");
      setFresh(data.token);
      onChange(data.token); // od razu używaj w przykładach API/MCP
      setName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się wygenerować tokenu.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!session) return;
    setError(null);
    try {
      const res = await fetch(`/api/tokens/${id}`, { method: "DELETE", headers: authHeader() });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Nie udało się odwołać tokenu.");
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się odwołać tokenu.");
    }
  }

  async function copyFresh() {
    if (!fresh) return;
    try {
      await navigator.clipboard.writeText(fresh);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard niedostępny */
    }
  }

  // Niezalogowany: samo pole na wklejenie tokenu + zachęta.
  if (!user) {
    return (
      <div className="flex w-full flex-col gap-1 lg:w-auto">
        <TokenBar token={token} onChange={onChange} />
        <p className="px-1 text-xs text-ink-faint">
          <Link href="/" className="underline">
            Zaloguj się
          </Link>{" "}
          w aplikacji, aby wygenerować własny token.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex w-full items-center gap-2 lg:w-auto">
      <TokenBar token={token} onChange={onChange} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="shrink-0 rounded-[var(--r-chip)] border-2 border-ink bg-paper px-3 py-1.5 font-hand text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        Tokeny
      </button>

      {open && (
        <>
          {/* klik poza panelem zamyka */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,380px)] rounded-[var(--r-box)] border-2 border-ink bg-paper p-4 shadow-[var(--shadow-sticker)]">
            <div className="mb-3 flex items-center gap-2">
              <Icon name="note" size={20} />
              <h3 className="font-hand text-lg font-semibold">Twoje tokeny API</h3>
            </div>

            {/* generowanie */}
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nazwa, np. Claude Desktop"
                maxLength={80}
                className="min-w-0 flex-1 rounded-[var(--r-chip)] border-2 border-ink bg-paper px-3 py-1.5 text-sm text-ink outline-none placeholder:text-ink-faint"
              />
              <Button type="button" onClick={generate} disabled={busy} className="shrink-0">
                <Icon name="plus" size={18} />
                {busy ? "…" : "Generuj"}
              </Button>
            </div>

            {/* świeżo wygenerowany token — widoczny RAZ */}
            {fresh && (
              <div className="mt-3 rounded-[var(--r-box)] border-2 border-ink bg-paper-2 p-3">
                <p className="mb-1 flex items-center gap-1.5 font-hand text-xs font-bold text-ink">
                  <Icon name="warn" size={15} />
                  Skopiuj teraz — nie pokażemy go ponownie.
                </p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 break-all font-mono text-xs text-ink">{fresh}</code>
                  <button
                    type="button"
                    onClick={copyFresh}
                    className="shrink-0 rounded-[var(--r-chip)] border-2 border-ink bg-paper px-2.5 py-1 font-hand text-xs font-semibold text-ink hover:bg-ink hover:text-paper"
                  >
                    {copied ? "Skopiowano" : "Kopiuj"}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="mt-2 text-xs text-danger">{error}</p>}

            {/* lista */}
            <ul className="mt-3 max-h-[40vh] overflow-y-auto">
              {tokens.length === 0 && (
                <li className="py-2 text-sm text-ink-faint">Brak tokenów. Wygeneruj pierwszy powyżej.</li>
              )}
              {tokens.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 border-b border-hairline py-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-hand text-sm font-semibold text-ink">{t.name}</p>
                    <p className="truncate font-mono text-xs text-ink-faint">{t.token_prefix}</p>
                    <p className="text-[11px] text-ink-faint">
                      utworzono {fmtDate(t.created_at)} · użyto {fmtDate(t.last_used_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => revoke(t.id)}
                    aria-label={`Odwołaj token ${t.name}`}
                    className="shrink-0 rounded-[var(--r-chip)] border-2 border-danger px-2 py-1 font-hand text-xs font-semibold text-danger hover:bg-danger hover:text-paper"
                  >
                    Odwołaj
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
