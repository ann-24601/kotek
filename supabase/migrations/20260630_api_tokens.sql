-- Osobiste tokeny API (per-user) dla zewnętrznego REST API (/api/v1/*) i MCP (/api/mcp).
-- Zastępują jeden wspólny KOTEK_API_TOKEN + KOTEK_USER_ID: każdy użytkownik ma własne
-- tokeny, a autoryzacja rozpoznaje po nich jego user_id.
--
-- Trzymamy WYŁĄCZNIE hash tokenu (SHA-256). Pełny token pokazujemy użytkownikowi raz
-- przy generowaniu i nigdy później. Cały dostęp do tej tabeli idzie przez service_role
-- (routy serwerowe) — RLS bez polityk dla authenticated/anon czyni hashe nieczytelnymi
-- z klienta. Zastosowane na projekcie Supabase iythcbjjzwalyftxwswo (migracja: api_tokens).

create table if not exists public.api_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,                 -- etykieta, np. „Claude Desktop"
  token_hash    text not null unique,          -- SHA-256 (hex) pełnego tokenu
  token_prefix  text not null,                 -- np. 'kotek_AbCd…' do wyświetlenia na liście
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

create index if not exists api_tokens_user_id_idx on public.api_tokens (user_id);

alter table public.api_tokens enable row level security;

-- Świadomie BRAK polityk dla authenticated/anon → klient (anon key) nie czyta ani nie
-- pisze tej tabeli. Generowanie, lista i odwoływanie tokenów odbywa się wyłącznie przez
-- service_role w routach /api/tokens (po weryfikacji sesji użytkownika), a sama
-- autoryzacja API/MCP — przez lookup po token_hash również service_role'em.
