/* =============================================================
   Kotek — powłoka dokumentacji (/docs).
   Wspólny górny pasek (logo + token + zakładki API|MCP) oraz
   lewa nawigacja zależna od aktywnej zakładki. Token i wybrana
   zakładka żyją tutaj — przełączanie zakładki NIE czyści tokenu.
   Styl wzorowany na dokumentacji Vercel.
   ============================================================= */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TokenManager } from "./TokenManager";
import ApiDocs from "./ApiDocs";
import McpDocs from "./McpDocs";

type Tab = "api" | "mcp";

const NAV: Record<Tab, { href: string; label: string }[]> = {
  api: [
    { href: "#create", label: "Create" },
    { href: "#ask", label: "Ask" },
    { href: "#read", label: "Read" },
  ],
  mcp: [
    { href: "#mcp-setup", label: "Autoryzacja" },
    { href: "#mcp-connect", label: "Podłączenie" },
    { href: "#mcp-tools", label: "Narzędzia" },
  ],
};

export default function DocsApp() {
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<Tab>("api");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Wspólny górny pasek */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-paper">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center text-ink no-underline active:opacity-60"
              aria-label="Wróć do aplikacji Kotek"
            >
              <Icon name="arrowRight" size={22} className="rotate-180" />
            </Link>
            <span className="font-hand text-[1.6rem] font-bold tracking-wide">Docs</span>
          </div>
          <TokenManager token={token} onChange={setToken} />
        </div>

        {/* Przełącznik sekcji API / MCP — segmentowy switch */}
        <nav className="px-4 pb-3 lg:px-6" aria-label="Sekcje dokumentacji">
          <div className="inline-flex rounded-full border-2 border-[#c9c9c4] p-0.5">
            {(["api", "mcp"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-current={tab === t ? "page" : undefined}
                className={
                  "rounded-full px-5 py-1.5 font-hand text-[1.0625rem] font-semibold no-underline transition-colors " +
                  (tab === t ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")
                }
              >
                {t === "api" ? "API" : "MCP"}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Treść + lewa nawigacja kotwic */}
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="shrink-0 lg:sticky lg:top-[var(--docs-aside-top,7.5rem)] lg:h-fit lg:w-[var(--sidebar-w)] lg:border-r-2 lg:border-ink">
          <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3 lg:flex-col lg:py-4">
            <p className="hidden shrink-0 px-1 pb-1 font-hand text-sm font-semibold uppercase tracking-wide text-ink-faint lg:block">
              {tab === "api" ? "API" : "MCP"}
            </p>
            {NAV[tab].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--r-chip)] border-2 border-[#c9c9c4] px-3 py-2 font-hand text-[1.0625rem] font-semibold text-ink no-underline transition-colors hover:border-ink"
              >
                <Icon name="note" size={20} />
                <span>{item.label}</span>
              </a>
            ))}
            <div className="hidden lg:mt-2 lg:block">
              <Link
                href="/"
                className="flex items-center gap-2 px-1 py-2 font-hand text-base text-ink-faint no-underline hover:text-ink"
              >
                <Icon name="arrowRight" size={18} className="rotate-180" />
                <span>Wróć do aplikacji</span>
              </Link>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {tab === "api" ? <ApiDocs token={token} /> : <McpDocs token={token} />}

          <div className="mx-auto max-w-[760px] px-5 pb-10 lg:hidden">
            <Link href="/" className="flex items-center gap-2 text-ink no-underline">
              <Icon name="arrowRight" size={18} className="rotate-180" />
              <span className="font-hand text-lg font-semibold">Wróć do aplikacji</span>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
