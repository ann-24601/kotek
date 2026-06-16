"use client";

/* =============================================================
   Kotek — przełącznik agentów (popover spod ikony w pasku).
   Lista agentów z rejestru: wybrany wyróżniony, zablokowani płatni
   mają przycisk KUP (→ Stripe Payment Link), na dole „Zobacz wszystkich".
   ============================================================= */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/context/AuthContext";
import { useAgents } from "@/context/AgentsContext";
import { AGENTS, buildCheckoutUrl, type AgentDef } from "@/lib/agents/registry";
import { cn } from "@/lib/utils";

export function AgentSwitcher() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const { hasAgent, selectedAgentId, selectAgent } = useAgents();
  const router = useRouter();

  const startCheckout = (agent: AgentDef) => {
    const userId = session?.user?.id;
    if (!userId) return;
    const url = buildCheckoutUrl(agent, userId, session?.user?.email);
    // Brak skonfigurowanego linku → pokaż galerię zamiast prowadzić donikąd.
    if (!url) {
      router.push("/agenci");
      return;
    }
    window.location.href = url;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center ink-edge rounded-[var(--r-box)] bg-paper text-ink active:translate-x-[1px] active:translate-y-[1px]"
        aria-label="Wybierz agenta"
        aria-expanded={open}
      >
        <Icon name="agents" size={24} />
      </button>

      {open && (
        <>
          {/* klik poza panelem zamyka */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] max-w-[calc(100vw-2rem)] ink-edge rounded-[var(--r-box)] bg-paper p-2"
            role="menu"
          >
            <p className="px-2 pb-1 pt-1 font-hand text-xs font-bold text-ink-faint">
              Wybierz agenta
            </p>

            <ul className="flex flex-col gap-1">
              {AGENTS.map((agent) => {
                const owned = hasAgent(agent.id);
                const active = agent.id === selectedAgentId;
                return (
                  <li key={agent.id}>
                    <div
                      className={cn(
                        "flex items-center gap-2.5 rounded-[var(--r-chip)] border-2 px-2.5 py-2",
                        active
                          ? "ink-edge ink-edge--chip border-ink bg-ink text-paper"
                          : "border-transparent",
                      )}
                    >
                      <Icon name={agent.icon} size={22} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-hand text-[1.05rem] font-bold">
                            {agent.name}
                          </span>
                          {active && (
                            <Icon name="check" size={14} className="shrink-0" />
                          )}
                        </div>
                        <p
                          className={cn(
                            "truncate text-xs",
                            active ? "text-paper/80" : "text-ink-soft",
                          )}
                        >
                          {agent.tagline}
                        </p>
                      </div>

                      {/* akcja po prawej */}
                      {owned ? (
                        active ? null : (
                          <button
                            type="button"
                            onClick={() => {
                              selectAgent(agent.id);
                              setOpen(false);
                            }}
                            className="shrink-0 rounded-[var(--r-chip)] border-2 border-ink bg-paper px-2.5 py-1 font-hand text-xs font-bold text-ink active:translate-x-[1px] active:translate-y-[1px]"
                          >
                            Wybierz
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => startCheckout(agent)}
                          className="shrink-0 rounded-[var(--r-chip)] border-2 border-ink bg-ink px-3 py-1 font-hand text-xs font-bold text-paper active:translate-x-[1px] active:translate-y-[1px]"
                        >
                          KUP{agent.priceLabel ? ` · ${agent.priceLabel}` : ""}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <Link
              href="/agenci"
              onClick={() => setOpen(false)}
              className="mt-1.5 flex items-center justify-center gap-1.5 rounded-[var(--r-chip)] border-2 border-transparent py-2 font-hand text-sm font-bold text-ink no-underline hover:border-hairline"
            >
              Zobacz wszystkich
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
