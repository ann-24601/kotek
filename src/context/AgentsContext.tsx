"use client";

/* =============================================================
   Kotek — stan agentów po stronie klienta.
   - `owned`: zbiór agentów kupionych przez użytkownika (czytane z Supabase,
     tabela entitlements, RLS = tylko własne wiersze). Odblokowanie w UI.
   - `selectedAgentId`: aktualnie wybrany agent (localStorage). Jeśli wybrany
     płatny przestaje być posiadany → fallback do darmowego.
   Bezpieczeństwo realne zapewnia serwer (/api/chat sprawdza entitlements);
   tutaj jest tylko warstwa UX.
   ============================================================= */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { FREE_AGENT_ID, getAgent, isPaidAgent } from "@/lib/agents/registry";

const STORAGE_KEY = "kotek.selectedAgentId";

interface AgentsState {
  /** Id agentów, które user kupił (płatne; darmowe są zawsze dostępne). */
  owned: Set<string>;
  loading: boolean;
  /** Czy agent jest dostępny: darmowy zawsze, płatny po zakupie. */
  hasAgent: (agentId: string) => boolean;
  /** Ponowne pobranie uprawnień (np. po powrocie z płatności). */
  refetch: () => Promise<void>;
  selectedAgentId: string;
  /** Wybór agenta (ignoruje płatnego bez uprawnienia). */
  selectAgent: (agentId: string) => void;
}

const Ctx = createContext<AgentsState | null>(null);

export function AgentsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(FREE_AGENT_ID);

  // Wczytaj zapisany wybór z localStorage (jednorazowo).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && getAgent(saved)) setSelectedAgentId(saved);
  }, []);

  const refetch = useCallback(async () => {
    if (!userId) {
      setOwned(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("entitlements")
      .select("agent_id")
      .eq("user_id", userId);
    if (error) {
      console.error("Nie udało się pobrać uprawnień:", error);
      setOwned(new Set());
    } else {
      setOwned(new Set((data ?? []).map((r) => r.agent_id as string)));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const hasAgent = useCallback(
    (agentId: string) => !isPaidAgent(agentId) || owned.has(agentId),
    [owned],
  );

  // Jeśli wybrany płatny agent nie jest (już) posiadany → wróć do darmowego.
  useEffect(() => {
    if (loading) return;
    if (!hasAgent(selectedAgentId)) {
      setSelectedAgentId(FREE_AGENT_ID);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, FREE_AGENT_ID);
      }
    }
  }, [loading, hasAgent, selectedAgentId]);

  const selectAgent = useCallback(
    (agentId: string) => {
      const agent = getAgent(agentId);
      if (!agent) return;
      if (agent.tier === "paid" && !owned.has(agentId)) return; // brak uprawnienia
      setSelectedAgentId(agentId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, agentId);
      }
    },
    [owned],
  );

  const value = useMemo<AgentsState>(
    () => ({ owned, loading, hasAgent, refetch, selectedAgentId, selectAgent }),
    [owned, loading, hasAgent, refetch, selectedAgentId, selectAgent],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAgents(): AgentsState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAgents musi być użyte wewnątrz <AgentsProvider>");
  return ctx;
}
