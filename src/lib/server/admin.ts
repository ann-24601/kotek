/* =============================================================
   Kotek — serwerowy klient Supabase (service_role).
   TYLKO po stronie serwera. Klucz service_role omija RLS,
   dlatego każde zapytanie MUSI być jawnie zawężone do user_id.
   ============================================================= */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Brak zmiennej środowiskowej ${name}`);
  return v;
}

export function adminClient(): SupabaseClient {
  return createClient(
    envOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    envOrThrow("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
