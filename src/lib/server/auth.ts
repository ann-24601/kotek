/* =============================================================
   Kotek — autoryzacja API przez Personal Access Token.
   Nagłówek `Authorization: Bearer <token>` porównywany
   stałoczasowo z env KOTEK_API_TOKEN. Po sukcesie zwraca
   user_id właściciela (KOTEK_USER_ID).
   ============================================================= */
import { timingSafeEqual } from "node:crypto";
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
