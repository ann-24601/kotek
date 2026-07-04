/* =============================================================
   Kotek — rate limiting per klucz (token/user/IP).
   Fixed-window licznik w Postgresie (RPC check_rate_limit),
   spójny na serverless. Chroni głównie endpointy generujące
   koszt OpenAI przed nadużyciem przy wycieku tokenu.
   Fail-open: awaria licznika NIE blokuje żądania (loguje błąd).
   ============================================================= */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface RateLimitRule {
  /** Maksymalna liczba żądań w oknie. */
  limit: number;
  /** Długość okna w sekundach. */
  windowSeconds: number;
}

/** Gotowe reguły dla poszczególnych klas endpointów. */
export const RATE_LIMITS = {
  // Drogie (OpenAI): pytania do behawiorysty.
  ai: { limit: 20, windowSeconds: 60 },
  // Zapis/odczyt wpisów, operacje MCP.
  write: { limit: 60, windowSeconds: 60 },
} satisfies Record<string, RateLimitRule>;

/**
 * Wyciąga IP klienta z nagłówków proxy (Vercel: x-forwarded-for).
 * Zwraca 'unknown', gdy brak — wtedy współdzielą jedno wiadro (bezpieczny domysł).
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export interface RateVerdict {
  allowed: boolean;
  remaining: number;
  resetAt: string | null;
}

/**
 * Sprawdza i inkrementuje licznik dla `key`. Fail-open: gdy RPC zawiedzie,
 * przepuszcza żądanie (allowed=true) i loguje — dostępność > twardy limit.
 */
export async function checkRateLimit(
  sb: SupabaseClient,
  key: string,
  rule: RateLimitRule,
): Promise<RateVerdict> {
  const { data, error } = await sb.rpc("check_rate_limit", {
    p_key: key,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });
  if (error || !data || !data[0]) {
    if (error) console.error("rate limit RPC error:", error.message);
    return { allowed: true, remaining: rule.limit, resetAt: null };
  }
  const row = data[0] as { allowed: boolean; remaining: number; reset_at: string };
  return { allowed: row.allowed, remaining: row.remaining, resetAt: row.reset_at };
}

/**
 * Wygodny wrapper: sprawdza limit i — gdy przekroczony — zwraca gotową odpowiedź 429.
 * Gdy w normie, zwraca null (żądanie leci dalej). Dokłada nagłówki X-RateLimit-*.
 */
export async function enforceRateLimit(
  sb: SupabaseClient,
  key: string,
  rule: RateLimitRule,
): Promise<Response | null> {
  const v = await checkRateLimit(sb, key, rule);
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(rule.limit),
    "X-RateLimit-Remaining": String(v.remaining),
  };
  if (v.resetAt) headers["X-RateLimit-Reset"] = v.resetAt;

  if (v.allowed) return null;

  const retryAfter = v.resetAt
    ? Math.max(1, Math.ceil((new Date(v.resetAt).getTime() - Date.now()) / 1000))
    : rule.windowSeconds;
  return Response.json(
    { error: "Zbyt wiele żądań — spróbuj za chwilę." },
    { status: 429, headers: { ...headers, "Retry-After": String(retryAfter) } },
  );
}
