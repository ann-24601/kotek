/* =============================================================
   Kotek — zarządzanie osobistymi tokenami API (per-user).
   GET  = lista tokenów zalogowanego użytkownika (bez hasha).
   POST = wygenerowanie nowego tokenu; pełny token zwracany RAZ.
   Autoryzacja: Authorization: Bearer <access_token sesji Supabase>.
   Tabela api_tokens jest dostępna wyłącznie service_role'em
   (adminClient), zawsze zawężona do user_id z sesji.
   ============================================================= */
import { randomBytes } from "node:crypto";
import { adminClient } from "@/lib/server/admin";
import { hashToken, requireUser } from "@/lib/server/auth";

export const runtime = "nodejs";

/** Nowy sekret: kotek_<43 znaki base64url> (32 bajty entropii). */
function generateToken(): string {
  return `kotek_${randomBytes(32).toString("base64url")}`;
}

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    const sb = adminClient();
    const { data, error } = await sb
      .from("api_tokens")
      .select("id, name, token_prefix, created_at, last_used_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ ok: true, tokens: data ?? [] });
  } catch (err) {
    console.error("tokens GET error:", err);
    return Response.json({ error: "Nie udało się pobrać tokenów." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* puste body = domyślna nazwa */
  }
  const name =
    typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : "Token";

  const token = generateToken();
  const prefix = `${token.slice(0, 14)}…`;

  try {
    const sb = adminClient();
    const { data, error } = await sb
      .from("api_tokens")
      .insert({
        user_id: auth.userId,
        name,
        token_hash: hashToken(token),
        token_prefix: prefix,
      })
      .select("id, name, token_prefix, created_at")
      .single();
    if (error) throw error;

    const row = data as { id: string; name: string; token_prefix: string; created_at: string };
    // Pełny `token` zwracamy TYLKO tutaj — nigdy nie jest zapisywany ani pokazywany ponownie.
    return Response.json({ ok: true, token, ...row });
  } catch (err) {
    console.error("tokens POST error:", err);
    return Response.json({ error: "Nie udało się wygenerować tokenu." }, { status: 500 });
  }
}
