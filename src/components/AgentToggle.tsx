"use client";

/* =============================================================
   Kotek — przełącznik wersji behawiorysty jako segmentowy „switch".
   Dwa segmenty: Podstawowy (free) ↔ PRO (paid). Aktywny = wypełniony
   tuszem. Kliknięcie PRO bez uprawnienia → checkout (Stripe Payment
   Link), tak jak w galerii agentów. Zastępuje popover z paska.
   ============================================================= */

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
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
  );
}
