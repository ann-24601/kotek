"use client";

/* =============================================================
   Kotek — przełącznik wersji behawiorysty jako segmentowy „switch".
   Dwa segmenty: Podstawowy (free) ↔ PRO (paid). Aktywny = wypełniony
   tuszem. Kliknięcie PRO bez uprawnienia → popup z opisem i CTA „Kup"
   prowadzącym prosto do checkoutu Stripe (Payment Link z doklejonym
   client_reference_id); zakup odblokowuje webhook → entitlements.
   ============================================================= */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useAgents } from "@/context/AgentsContext";
import {
  FREE_AGENT_ID,
  PRO_AGENT_ID,
  getAgent,
  buildCheckoutUrl,
} from "@/lib/agents/registry";
import { cn } from "@/lib/utils";

export function AgentToggle() {
  const router = useRouter();
  const { session } = useAuth();
  const { hasAgent, selectedAgentId, selectAgent } = useAgents();
  const [showUpsell, setShowUpsell] = useState(false);

  const free = getAgent(FREE_AGENT_ID);
  const pro = getAgent(PRO_AGENT_ID);
  if (!free || !pro) return null;

  const ownsPro = hasAgent(PRO_AGENT_ID);
  const proActive = selectedAgentId === PRO_AGENT_ID;

  const goPro = () => {
    if (ownsPro) {
      selectAgent(PRO_AGENT_ID);
      return;
    }
    setShowUpsell(true);
  };

  const buy = () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const url = buildCheckoutUrl(pro, userId, session?.user?.email);
    // Brak skonfigurowanego linku → galeria zamiast prowadzić donikąd.
    if (!url) {
      router.push("/agenci");
      return;
    }
    window.location.href = url;
  };

  const segment =
    "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--r-chip)] px-3 py-1.5 font-hand text-sm font-bold transition-transform active:translate-x-[1px] active:translate-y-[1px]";

  return (
    <>
      <div
        role="group"
        aria-label="Wersja behawiorysty"
        className="ink-edge ink-edge--chip flex items-center gap-1 rounded-[var(--r-chip)] bg-paper p-1"
      >
        <button
          type="button"
          onClick={() => selectAgent(FREE_AGENT_ID)}
          aria-pressed={!proActive}
          className={cn(segment, proActive ? "text-ink-soft" : "bg-ink text-paper")}
        >
          <Icon name={free.icon} size={18} className="shrink-0" />
          Podstawowy
        </button>

        <button
          type="button"
          onClick={goPro}
          aria-pressed={proActive}
          className={cn(segment, proActive ? "bg-ink text-paper" : "text-ink-soft")}
        >
          <Icon name="sparkle" size={15} className="shrink-0" />
          PRO
          {!ownsPro && (
            <span
              className={cn(
                "text-xs font-bold",
                proActive ? "text-paper/80" : "text-ink-faint",
              )}
            >
              · {pro.priceLabel}
            </span>
          )}
        </button>
      </div>

      {/* popup zakupu PRO — zamiast wyrzucać z zaskoczenia do Stripe */}
      {showUpsell && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Kup Behawiorystę PRO"
          onClick={() => setShowUpsell(false)}
        >
          <div
            className="ink-edge ink-edge--soft w-full max-w-[380px] rounded-[var(--r-box-2)] bg-paper p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 font-hand text-xl font-semibold">
                <Icon name={pro.icon} size={24} />
                {pro.name}
              </h2>
              <button
                type="button"
                onClick={() => setShowUpsell(false)}
                aria-label="Zamknij"
                className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center text-ink-soft hover:text-ink"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <p className="mt-0.5 font-hand text-sm font-semibold text-ink-soft">{pro.tagline}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{pro.description}</p>
            <p className="mt-3 font-hand text-lg font-bold">
              {pro.priceLabel}
              <span className="ml-1 text-sm font-semibold text-ink-faint">— jednorazowo</span>
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button block size="lg" onClick={buy}>
                <Icon name="sparkle" size={19} />
                Kup PRO
              </Button>
              <Button block variant="ghost" onClick={() => setShowUpsell(false)}>
                Nie teraz
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-ink-faint">
              Płatność obsługuje Stripe. Po zakupie PRO odblokuje się na tym koncie.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
