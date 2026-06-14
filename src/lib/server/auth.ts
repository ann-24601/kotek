/* =============================================================
   Kotek — autoryzacja API przez Personal Access Token.
   Nagłówek `Authorization: Bearer <token>` porównywany
   stałoczasowo z env KOTEK_API_TOKEN. Po sukcesie zwraca
   user_id właściciela (KOTEK_USER_ID).
   ============================================================= */
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { envOrThrow } from "./admin";

export interface AuthOk {
  userId: string;
}

/**
 * Stałoczasowe porównanie tokenu z KOTEK_API_TOKEN.
 * Reużywane przez REST (requireToken) i MCP (verifyToken).
 * Gdy serwer nie ma skonfigurowanego tokenu — zawsze false.
 */
export function checkToken(token: string): boolean {
  const expected = process.env.KOTEK_API_TOKEN;
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Zwraca { userId } albo gotową odpowiedź 401/500. */
export function requireToken(req: Request): AuthOk | Response {
  if (!process.env.KOTEK_API_TOKEN) {
    return Response.json(
      { error: "Serwer nie ma skonfigurowanego KOTEK_API_TOKEN." },
      { status: 500 },
    );
  }
  const header = req.headers.get("authorization") ?? "";
  const got = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!checkToken(got)) {
    return Response.json({ error: "Brak autoryzacji." }, { status: 401 });
  }
  return { userId: envOrThrow("KOTEK_USER_ID") };
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
