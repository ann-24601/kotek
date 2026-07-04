/* =============================================================
   Kotek — webhook synchronizacji Strapi → Supabase.
   Strapi (lifecycle kolekcji `wpis`) woła ten endpoint po każdej
   zmianie wpisu — niezależnie od źródła (aplikacja czy panel admina).
   Tu liczymy embedding notatki (OpenAI, klucz serwerowy) i upsertujemy
   pochodny indeks wyszukiwania `entry_index` (wektor + note + metrics +
   link do wpisu w Strapi). Dzięki temu wpisy dodane w panelu też trafiają
   do wyszukiwania wektorowego behawiorysty.
   Autoryzacja: nagłówek `X-Sync-Secret` == STRAPI_SYNC_SECRET.
   ============================================================= */
import { timingSafeEqual } from "node:crypto";
import { adminClient } from "@/lib/server/admin";
import { stripHtml } from "@/lib/html";
import { embed, toVectorLiteral } from "@/lib/server/embeddings";

export const runtime = "nodejs";

interface SyncEntry {
  documentId: string;
  date: string;
  userId: string;
  note: string | null;
  metrics: Record<string, unknown> | null;
  photos: string[] | null;
}

function secretOk(req: Request): boolean {
  const expected = process.env.STRAPI_SYNC_SECRET;
  if (!expected) return false;
  const got = req.headers.get("x-sync-secret") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!secretOk(req)) {
    return Response.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  let body: { action?: string; entry?: SyncEntry };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const { action, entry } = body;
  if (!entry || !entry.userId || !entry.date) {
    return Response.json({ error: "Brak danych wpisu." }, { status: 400 });
  }

  const sb = adminClient();

  try {
    if (action === "delete") {
      const { error } = await sb
        .from("entry_index")
        .delete()
        .eq("user_id", entry.userId)
        .eq("date", entry.date);
      if (error) throw error;
      return Response.json({ ok: true, action: "delete" });
    }

    // upsert (create/update)
    const text = entry.note ? stripHtml(entry.note) : "";
    const embedding = text ? toVectorLiteral(await embed(text)) : null;

    const { error } = await sb.from("entry_index").upsert(
      {
        user_id: entry.userId,
        date: entry.date,
        note: entry.note ?? null,
        metrics: entry.metrics ?? {},
        embedding,
        strapi_document_id: entry.documentId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" },
    );
    if (error) throw error;

    return Response.json({ ok: true, action: "upsert" });
  } catch (err) {
    console.error("strapi-sync error:", err);
    return Response.json({ error: "Sync nieudany." }, { status: 500 });
  }
}
