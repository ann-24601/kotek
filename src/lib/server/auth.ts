/* =============================================================
   Kotek — autoryzacja API przez osobiste tokeny (per-user).
   Nagłówek `Authorization: Bearer <token>` rozpoznawany po
   SHA-256 w tabeli api_tokens → user_id właściciela tokenu.
   Stary, wspólny KOTEK_API_TOKEN działa jeszcze jako fallback
   (mapowany na KOTEK_USER_ID) na czas migracji.
   ============================================================= */
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { adminClient, envOrThrow } from "./admin";

export interface AuthOk {
  userId: string;
}

/** SHA-256 (hex) tokenu — w bazie trzymamy tylko hash, nigdy pełny token. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Stałoczasowe porównanie tokenu z (legacy) KOTEK_API_TOKEN.
 * Gdy serwer nie ma skonfigurowanego tokenu — zawsze false.
 */
export function checkToken(token: string): boolean {
  const expected = process.env.KOTEK_API_TOKEN;
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Rozpoznaje token osobisty po hashu i zwraca user_id właściciela (albo null).
 * Best-effort odświeża last_used_at. Reużywane przez REST (requireToken) i MCP.
 */
export async function lookupTokenUser(token: string): Promise<string | null> {
  if (!token) return null;
  const sb = adminClient();
  const { data, error } = await sb
    .from("api_tokens")
    .select("id, user_id")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (error || !data) return null;

  const row = data as { id: string; user_id: string };
  void sb
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id)
    .then(({ error: e }) => {
      if (e) console.error("api_tokens last_used_at update:", e.message);
    });
  return row.user_id;
}

/**
 * Autoryzacja zewnętrznego API/MCP tokenem osobistym (Bearer).
 * Kolejność: token osobisty (api_tokens) → fallback na wspólny KOTEK_API_TOKEN.
 * Zwraca { userId } albo gotową odpowiedź 401.
 */
export async function requireToken(req: Request): Promise<AuthOk | Response> {
  const header = req.headers.get("authorization") ?? "";
  const got = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!got) {
    return Response.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const userId = await resolveBearerUser(got);
  if (!userId) {
    return Response.json({ error: "Brak autoryzacji." }, { status: 401 });
  }
  return { userId };
}

/**
 * Wspólna logika rozpoznania właściciela Bearer tokenu (REST + MCP):
 * token osobisty albo legacy KOTEK_API_TOKEN → KOTEK_USER_ID. null = brak dostępu.
 */
export async function resolveBearerUser(token: string): Promise<string | null> {
  const fromToken = await lookupTokenUser(token);
  if (fromToken) return fromToken;
  if (process.env.KOTEK_API_TOKEN && checkToken(token)) {
    return envOrThrow("KOTEK_USER_ID");
  }
  return null;
}

/**
 * Autoryzacja zalogowanego użytkownika aplikacji (nie API tokenem).
 * Weryfikuje JWT sesji Supabase z nagłówka `Authorization: Bearer <access_token>`
 * po stronie serwera (getUser) i zwraca jego user_id. Dzięki temu endpoint
 * działa wyłącznie dla zalogowanej osoby i wyłącznie na JEJ danych.
 */
export async function requireUser(req: Request): Promise<AuthOk | Response> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return Response.json({ error: "Wymagane zalogowanie." }, { status: 401 });
  }

  const sb = createClient(
    envOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    envOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    return Response.json({ error: "Sesja nieważna lub wygasła." }, { status: 401 });
  }
  return { userId: data.user.id };
}
