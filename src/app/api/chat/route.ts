/* =============================================================
   Kotek — API behawiorysty AI (OpenAI Agents SDK).
   Działa po stronie serwera; klucz OPENAI_API_KEY NIGDY nie
   trafia do przeglądarki. Kontekst (profil + wpisy) przychodzi
   z klienta i jest wstrzykiwany do instrukcji agenta.
   ============================================================= */

import { Agent, run, setDefaultOpenAIKey, type AgentInputItem } from "@openai/agents";
import {
  buildInstructions,
  PERSONAS,
  type BehavioristContext,
  type RetrievedEntry,
} from "@/lib/behaviorist";
import { FREE_AGENT_ID, getAgent } from "@/lib/agents/registry";
import { makeSearchDiaryTool } from "@/lib/server/agent-tools";
import { adminClient } from "@/lib/server/admin";
import { requireUser } from "@/lib/server/auth";
import { hybridSearch } from "@/lib/server/search";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

/** Ile najtrafniejszych wpisów pobrać przed odpowiedzią agenta. */
const RETRIEVAL_LIMIT = 8;

interface ChatRequest {
  messages: ChatMessage[];
  context: BehavioristContext;
  /** Id wybranego agenta z rejestru. Domyślnie darmowy. */
  agentId?: string;
}

/**
 * Serwerowa bramka dostępu: czy user faktycznie kupił danego płatnego agenta.
 * To prawdziwa kontrola — blokada w UI jest tylko kosmetyczna. Czyta entitlements
 * kluczem service_role (zapis tam możliwy wyłącznie z webhooka Stripe).
 */
async function userOwnsAgent(userId: string, agentId: string): Promise<boolean> {
  const { data, error } = await adminClient()
    .from("entitlements")
    .select("id")
    .eq("user_id", userId)
    .eq("agent_id", agentId)
    .maybeSingle();
  if (error) {
    console.error("Sprawdzenie uprawnienia nie powiodło się:", error);
    return false;
  }
  return Boolean(data);
}

/**
 * Wymuszony RAG: zanim agent odpowie, przeszukuje dziennik (hybrydowo)
 * ostatnim pytaniem opiekuna i zwraca najtrafniejsze wpisy. Best-effort —
 * błąd wyszukiwania nie blokuje rozmowy (agent ma pełny dziennik w kontekście).
 */
async function retrieveRelevant(userId: string, query: string): Promise<RetrievedEntry[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const hits = await hybridSearch(adminClient(), userId, {
      query: q,
      limit: RETRIEVAL_LIMIT,
    });
    return hits.map((h) => ({ date: h.date, note: h.note, metrics: h.metrics }));
  } catch (err) {
    console.error("Behawiorysta — wyszukiwanie hybrydowe nie powiodło się:", err);
    return [];
  }
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Brak klucza OPENAI_API_KEY na serwerze." },
      { status: 500 },
    );
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Nieprawidłowe żądanie." }, { status: 400 });
  }

  const { messages, context } = body;
  if (!messages?.length) {
    return Response.json({ error: "Brak wiadomości." }, { status: 400 });
  }

  // Wybór agenta: nieznane id → darmowy. Płatny → wymaga zakupu (entitlements).
  const agentDef = getAgent(body.agentId ?? FREE_AGENT_ID) ?? getAgent(FREE_AGENT_ID)!;
  if (agentDef.tier === "paid" && !(await userOwnsAgent(auth.userId, agentDef.id))) {
    return Response.json(
      { error: "Ten agent jest zablokowany — wymaga zakupu." },
      { status: 403 },
    );
  }
  const persona = PERSONAS[agentDef.id] ?? PERSONAS[FREE_AGENT_ID];

  try {
    setDefaultOpenAIKey(apiKey);

    // Wymuszone pre-retrieval: najpierw przeszukaj bazę ostatnim pytaniem
    // opiekuna, dopiero potem agent odpowiada na bazie znalezionych wpisów.
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const retrieved = await retrieveRelevant(auth.userId, lastUser?.content ?? "");

    const agent = new Agent({
      name: agentDef.name,
      instructions: buildInstructions(context, retrieved, persona),
      tools: [makeSearchDiaryTool(auth.userId)],
    });

    const input: AgentInputItem[] = messages.map((m) =>
      m.role === "user"
        ? { role: "user", content: m.content }
        : {
            role: "assistant",
            status: "completed",
            content: [{ type: "output_text", text: m.content }],
          },
    );

    const result = await run(agent, input);

    return Response.json({ reply: result.finalOutput ?? "" });
  } catch (err) {
    console.error("Behawiorysta API error:", err);
    return Response.json(
      { error: "Nie udało się uzyskać odpowiedzi od behawiorysty." },
      { status: 500 },
    );
  }
}
