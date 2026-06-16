"use client";

/* =============================================================
   Kotek — galeria agentów (pełny widok „sklepu").
   Karty agentów ze statusem (Wybrany / Posiadasz / KUP). Obsługuje
   ?success=1 po powrocie z płatności: baner + odświeżenie uprawnień.
   ============================================================= */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/context/AuthContext";
import { useAgents } from "@/context/AgentsContext";
import { AGENTS, buildCheckoutUrl, type AgentDef } from "@/lib/agents/registry";
import { cn } from "@/lib/utils";

export function Agents() {
  const { session } = useAuth();
  const { hasAgent, selectedAgentId, selectAgent, refetch, loading } = useAgents();
  const router = useRouter();
  const params = useSearchParams();
  const [justPaid, setJustPaid] = useState(false);

  // Powrót z płatności: pokaż podziękowanie i odśwież uprawnienia.
  // UWAGA: to tylko UX — autorytatywne odblokowanie robi webhook Stripe.
  useEffect(() => {
    if (params.get("success") === "1") {
      setJustPaid(true);
      void refetch();
      router.replace("/agenci");
    }
  }, [params, refetch, router]);

  const startCheckout = (agent: AgentDef) => {
    const userId = session?.user?.id;
    if (!userId) return;
    const url = buildCheckoutUrl(agent, userId, session?.user?.email);
    if (!url) {
      alert("Płatność nie jest jeszcze skonfigurowana. Spróbuj ponownie później.");
      return;
    }
    window.location.href = url;
  };

  return (
    <div className="flex flex-col gap-5 pt-2">
      <header>
        <h1 className="text-2xl">Agenci</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Wybierz, z kim rozmawiasz w zakładce Behawiorysta. Wersje PRO odblokowujesz raz — zostają na zawsze.
        </p>
      </header>

      {justPaid && (
        <div
          className="ink-edge flex items-center gap-2.5 rounded-[var(--r-box)] bg-paper px-4 py-3"
          role="status"
        >
          <Icon name="sparkle" size={20} className="shrink-0" />
          <p className="text-sm">
            <strong>Dziękujemy za zakup!</strong> Odblokowanie potwierdzamy automatycznie — jeśli agent nie jest jeszcze aktywny, odśwież za chwilę.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {AGENTS.map((agent) => {
          const owned = hasAgent(agent.id);
          const active = agent.id === selectedAgentId;
          return (
            <article
              key={agent.id}
              className={cn(
                "ink-edge flex flex-col gap-2 rounded-[var(--r-box)] bg-paper p-4",
                active && "outline outline-[2.5px] outline-dashed outline-ink outline-offset-[3px]",
              )}
            >
              <div className="flex items-start gap-2.5">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center ink-edge rounded-[var(--r-box)]">
                  <Icon name={agent.icon} size={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-hand text-lg font-bold leading-tight">{agent.name}</h2>
                  <p className="text-xs text-ink-soft">{agent.tagline}</p>
                </div>
                {/* status */}
                <span className="shrink-0 font-hand text-xs font-bold text-ink-faint">
                  {agent.tier === "free" ? "W cenie" : owned ? "Posiadasz" : agent.priceLabel}
                </span>
              </div>

              <p className="text-sm text-ink-soft">{agent.description}</p>

              <div className="mt-1.5">
                {owned ? (
                  active ? (
                    <span className="inline-flex items-center gap-1.5 font-hand text-sm font-bold text-ink">
                      <Icon name="check" size={16} /> Wybrany
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => selectAgent(agent.id)}
                      className="ink-edge rounded-[var(--r-chip)] bg-paper px-4 py-2 font-hand text-sm font-bold text-ink active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      Wybierz
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => startCheckout(agent)}
                    disabled={loading}
                    className="ink-edge rounded-[var(--r-chip)] bg-ink px-4 py-2 font-hand text-sm font-bold text-paper active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
                  >
                    KUP{agent.priceLabel ? ` · ${agent.priceLabel}` : ""}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
