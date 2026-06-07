/* =============================================================
   Kotek — API behawiorysty AI (OpenAI Agents SDK).
   Działa po stronie serwera; klucz OPENAI_API_KEY NIGDY nie
   trafia do przeglądarki. Kontekst (profil + wpisy) przychodzi
   z klienta i jest wstrzykiwany do instrukcji agenta.
   ============================================================= */

import { Agent, run, setDefaultOpenAIKey, type AgentInputItem } from "@openai/agents";
import { buildInstructions, type BehavioristContext } from "@/lib/behaviorist";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

interface ChatRequest {
  messages: ChatMessage[];
  context: BehavioristContext;
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

    const agent = new Agent({
      name: "Behawiorysta",
      instructions: buildInstructions(context),
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
