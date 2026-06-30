/* =============================================================
   Kotek API v1 — pytanie do agenta-behawiorysty (JSON, bez streamingu).
   Kontekst = pełny profil + wszystkie wpisy, z wyróżnieniem dnia.
   Historia rozmowy trzymana per dzień (chat_messages).
   Autoryzacja: Authorization: Bearer <osobisty token z /docs>.
   ============================================================= */
import { Agent, run, setDefaultOpenAIKey, type AgentInputItem } from "@openai/agents";
import { buildInstructions } from "@/lib/behaviorist";
import { adminClient } from "@/lib/server/admin";
import { requireToken } from "@/lib/server/auth";
import { appendDayMessages, getDayHistory, loadContext } from "@/lib/server/journal";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const today = () => new Date().toISOString().slice(0, 10);

export async function POST(req: Request) {
  const auth = await requireToken(req);
  if (auth instanceof Response) return auth;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Brak klucza OPENAI_API_KEY na serwerze." }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return Response.json({ error: "Pole 'question' jest wymagane." }, { status: 400 });
  }

  const date = (body.date as string | undefined) ?? today();
  if (!ISO_DATE.test(date)) {
    return Response.json(
      { error: "Pole 'date' musi mieć format YYYY-MM-DD." },
      { status: 400 },
    );
  }

  try {
    const sb = adminClient();
    const [ctx, history] = await Promise.all([
      loadContext(sb, auth.userId),
      getDayHistory(sb, auth.userId, date),
    ]);

    setDefaultOpenAIKey(apiKey);
    const agent = new Agent({
      name: "Behawiorysta",
      instructions: buildInstructions({ ...ctx, focusDate: date }),
    });

    // Wątek dnia + nowe pytanie → wejście agenta (kształt jak w /api/chat).
    const thread: ChatMessage[] = [...history, { role: "user", content: question }];
    const input: AgentInputItem[] = thread.map((m) =>
      m.role === "user"
        ? { role: "user", content: m.content }
        : {
            role: "assistant",
            status: "completed",
            content: [{ type: "output_text", text: m.content }],
          },
    );

    const result = await run(agent, input);
    const answer = result.finalOutput ?? "";

    // Zapis pary do wątku dnia.
    await appendDayMessages(sb, auth.userId, date, [
      { role: "user", content: question },
      { role: "assistant", content: answer },
    ]);

    const messages: ChatMessage[] = [...thread, { role: "assistant", content: answer }];
    return Response.json({ ok: true, date, answer, messages });
  } catch (err) {
    console.error("v1/ask POST error:", err);
    return Response.json(
      { error: "Nie udało się uzyskać odpowiedzi od behawiorysty." },
      { status: 500 },
    );
  }
}
