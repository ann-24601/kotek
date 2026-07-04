/* =============================================================
   Kotek — wpisy dziennika z aplikacji (per-user). Źródło prawdy = Strapi.
   GET    = wszystkie wpisy zalogowanego użytkownika (ekran dziennika).
   POST   = batchowy, nieniszczący upsert dni (zapis do Strapi).
   DELETE = wyczyszczenie wszystkich wpisów użytkownika (reset onboardingu).
   Autoryzacja: Authorization: Bearer <access_token sesji Supabase>.
   Embedding/entry_index domyka webhook Strapi (zob. /api/strapi-sync).
   ============================================================= */
import { adminClient } from "@/lib/server/admin";
import { requireUser } from "@/lib/server/auth";
import { listEntries, upsertEntries } from "@/lib/server/journal";
import { deleteWpis, listWpisy } from "@/lib/server/strapi";
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

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    const logs = await listEntries(auth.userId);
    return Response.json({ ok: true, logs });
  } catch (err) {
    console.error("entries GET error:", err);
    return Response.json({ error: "Odczyt nieudany." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    // Usuń wpisy ze Strapi (lifecycle webhook dosprząta entry_index)...
    const wpisy = await listWpisy(auth.userId);
    for (const w of wpisy) await deleteWpis(w.documentId);
    // ...i dla pewności wyczyść pochodny indeks bezpośrednio.
    const sb = adminClient();
    const { error } = await sb
      .from("entry_index")
      .delete()
      .eq("user_id", auth.userId);
    if (error) throw error;
    return Response.json({ ok: true, deleted: wpisy.length });
  } catch (err) {
    console.error("entries DELETE error:", err);
    return Response.json({ error: "Reset nieudany." }, { status: 500 });
  }
}
