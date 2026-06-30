/* =============================================================
   Kotek API v1 — wpisy dziennika.
   POST = dodanie/aktualizacja wpisu (domyślnie dziś).
   GET  = odczyt wpisu na dany dzień (domyślnie dziś).
   Autoryzacja: Authorization: Bearer <osobisty token z /docs>.
   ============================================================= */
import { adminClient } from "@/lib/server/admin";
import { requireToken } from "@/lib/server/auth";
import { validateMetrics } from "@/lib/server/metrics";
import { getEntry, upsertEntry } from "@/lib/server/journal";

export const runtime = "nodejs";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const today = () => new Date().toISOString().slice(0, 10);

export async function POST(req: Request) {
  const auth = await requireToken(req);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const date = (body.date as string | undefined) ?? today();
  if (!ISO_DATE.test(date)) {
    return Response.json(
      { error: "Pole 'date' musi mieć format YYYY-MM-DD." },
      { status: 400 },
    );
  }

  const v = validateMetrics(body.metrics);
  if ("error" in v) {
    return Response.json({ error: v.error }, { status: 400 });
  }

  const note =
    typeof body.note === "string" && body.note.trim() ? body.note : null;

  try {
    const sb = adminClient();
    const entry = await upsertEntry(sb, auth.userId, date, v.metrics, note);
    return Response.json({ ok: true, entry });
  } catch (err) {
    console.error("v1/entries POST error:", err);
    return Response.json({ error: "Zapis nieudany." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = await requireToken(req);
  if (auth instanceof Response) return auth;

  const date = new URL(req.url).searchParams.get("date") ?? today();
  if (!ISO_DATE.test(date)) {
    return Response.json(
      { error: "Parametr 'date' musi mieć format YYYY-MM-DD." },
      { status: 400 },
    );
  }

  try {
    const sb = adminClient();
    const entry = await getEntry(sb, auth.userId, date);
    return Response.json({ ok: true, entry });
  } catch (err) {
    console.error("v1/entries GET error:", err);
    return Response.json({ error: "Odczyt nieudany." }, { status: 500 });
  }
}
