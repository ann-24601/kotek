/* =============================================================
   Kotek — API behawiorysty AI (OpenAI Agents SDK).
   Działa po stronie serwera; klucz OPENAI_API_KEY NIGDY nie
   trafia do przeglądarki. Kontekst (profil + wpisy) przychodzi
   z klienta i jest wstrzykiwany do instrukcji agenta.
   ============================================================= */

import { Agent, run, setDefaultOpenAIKey, type AgentInputItem } from "@openai/agents";
import {
  buildInstructions,
  type BehavioristContext,
  type RetrievedEntry,
} from "@/lib/behaviorist";
import { searchDiaryTool } from "@/lib/server/agent-tools";
import { adminClient, envOrThrow } from "@/lib/server/admin";
import { hybridSearch } from "@/lib/server/search";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

/** Ile najtrafniejszych wpisów pobrać przed odpowiedzią agenta. */
const RETRIEVAL_LIMIT = 8;

interface ChatRequest {
  messages: ChatMessage[];
  context: BehavioristContext;
}

/**
 * Wymuszony RAG: zanim agent odpowie, przeszukuje dziennik (hybrydowo)
 * ostatnim pytaniem opiekuna i zwraca najtrafniejsze wpisy. Best-effort —
 * błąd wyszukiwania nie blokuje rozmowy (agent ma pełny dziennik w kontekście).
 */
async function retrieveRelevant(query: string): Promise<RetrievedEntry[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const hits = await hybridSearch(adminClient(), envOrThrow("KOTEK_USER_ID"), {
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

  try {
    setDefaultOpenAIKey(apiKey);

    // Wymuszone pre-retrieval: najpierw przeszukaj bazę ostatnim pytaniem
    // opiekuna, dopiero potem agent odpowiada na bazie znalezionych wpisów.
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const retrieved = await retrieveRelevant(lastUser?.content ?? "");

    const agent = new Agent({
      name: "Behawiorysta",
      instructions: buildInstructions(context, retrieved),
      tools: [searchDiaryTool],
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
