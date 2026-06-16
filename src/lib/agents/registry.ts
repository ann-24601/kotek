/* =============================================================
   Kotek — rejestr agentów (katalog "produktów").
   Definicje agentów żyją w KODZIE (nazwa, opis, cena-label, tier,
   link Stripe). Supabase trzyma WYŁĄCZNIE zakupy (tabela entitlements).
   Prompty (persony) żyją osobno w src/lib/behaviorist.ts — tu są tylko
   metadane potrzebne też w przeglądarce (żadnych sekretów).
   ============================================================= */

import type { IconName } from "@/components/Icon";

export type AgentTier = "free" | "paid";

export interface AgentDef {
  /** Stały identyfikator (klucz w entitlements i w metadanych Stripe). */
  id: string;
  name: string;
  /** Krótki podtytuł pod nazwą. */
  tagline: string;
  /** Dłuższy opis do galerii. */
  description: string;
  icon: IconName;
  tier: AgentTier;
  /** Tylko do wyświetlenia — prawdziwa cena żyje w Stripe. */
  priceLabel?: string;
  /**
   * Bazowy URL Stripe Payment Link (bez parametrów). Dla płatnych agentów.
   * Czytany z publicznej zmiennej env, by dało się go podmienić bez zmiany kodu.
   */
  stripePaymentLinkUrl?: string;
}

export const FREE_AGENT_ID = "behaviorist-free";
export const PRO_AGENT_ID = "behaviorist-pro";

export const AGENTS: AgentDef[] = [
  {
    id: FREE_AGENT_ID,
    name: "Behawiorysta",
    tagline: "Twój codzienny doradca od kota",
    description:
      "Ciepły specjalista od zachowania kotów. Opiera porady na profilu kota i wpisach z dziennika — pomaga z zabawą, rytuałem i drobnymi zachowaniami.",
    icon: "cat",
    tier: "free",
  },
  {
    id: PRO_AGENT_ID,
    name: "Behawiorysta PRO",
    tagline: "Pogłębione konsultacje eksperckie",
    description:
      "Mocniejsza wersja behawiorysty: bardziej dociekliwa analiza, ustrukturyzowane plany działania krok po kroku i głębsze odwołania do danych z dziennika. Dla trudniejszych przypadków i opiekunów, którzy chcą więcej.",
    icon: "agents",
    tier: "paid",
    priceLabel: "49 zł",
    stripePaymentLinkUrl: process.env.NEXT_PUBLIC_STRIPE_PRO_PAYMENT_LINK,
  },
];

export function getAgent(id: string): AgentDef | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function freeAgent(): AgentDef {
  return AGENTS.find((a) => a.tier === "free") ?? AGENTS[0];
}

export function isPaidAgent(id: string): boolean {
  return getAgent(id)?.tier === "paid";
}

export function paidAgents(): AgentDef[] {
  return AGENTS.filter((a) => a.tier === "paid");
}

/**
 * Buduje URL do Stripe Payment Link z doklejonym client_reference_id (= user_id)
 * i prefillem e-maila. To „klej" łączący płatność z konkretnym kontem:
 * Stripe odda client_reference_id w webhooku, dzięki czemu wiemy, komu odblokować.
 * Zwraca null, gdy agent nie jest płatny lub brak skonfigurowanego linku.
 */
export function buildCheckoutUrl(
  agent: AgentDef,
  userId: string,
  email?: string | null,
): string | null {
  if (agent.tier !== "paid" || !agent.stripePaymentLinkUrl) return null;
  const url = new URL(agent.stripePaymentLinkUrl);
  url.searchParams.set("client_reference_id", userId);
  if (email) url.searchParams.set("prefilled_email", email);
  return url.toString();
}
