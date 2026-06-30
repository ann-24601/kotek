/* =============================================================
   Kotek — zapis wpisów dziennika z aplikacji (per-user).
   POST = batchowy, nieniszczący upsert dni zalogowanego użytkownika
   wraz z generowaniem embeddingów notatek (wyszukiwanie wektorowe).
   Autoryzacja: Authorization: Bearer <access_token sesji Supabase>.
   Odpowiednik dawnego bezpośredniego zapisu z CatContext.saveLogs,
   ale liczący embedding po stronie serwera (klucz OpenAI jest serwerowy).
   ============================================================= */
import { adminClient } from "@/lib/server/admin";
import { requireUser } from "@/lib/server/auth";
import { upsertEntries } from "@/lib/server/journal";
import type { DayLog } from "@/lib/types";

export const runtime = "nodejs";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const raw = (body as { entries?: unknown }).entries;
  if (!Array.isArray(raw)) {
    return Response.json(
      { error: "Pole 'entries' musi być tablicą wpisów." },
      { status: 400 },
    );
  }

  const entries: DayLog[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) {
      return Response.json({ error: "Każdy wpis musi być obiektem." }, { status: 400 });
    }
    const e = item as Record<string, unknown>;
    if (typeof e.date !== "string" || !ISO_DATE.test(e.date)) {
      return Response.json(
        { error: "Każdy wpis wymaga 'date' w formacie YYYY-MM-DD." },
        { status: 400 },
      );
    }
    entries.push({
      date: e.date,
      m: (e.m as DayLog["m"]) ?? {},
      note: typeof e.note === "string" ? e.note : undefined,
      photos: Array.isArray(e.photos) ? (e.photos as string[]) : [],
    });
  }

  try {
    const sb = adminClient();
    await upsertEntries(sb, auth.userId, entries);
    return Response.json({ ok: true, count: entries.length });
  } catch (err) {
    console.error("entries POST error:", err);
    return Response.json({ error: "Zapis nieudany." }, { status: 500 });
  }
}
