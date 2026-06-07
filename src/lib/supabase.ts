/* =============================================================
   Kotek — klient Supabase (przeglądarka)
   ============================================================= */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Brak NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — uzupełnij .env.local",
  );
}

/** Singleton klienta — sesja trzymana w localStorage, auto-odświeżanie tokenu. */
export const supabase = createClient(url, anonKey);
