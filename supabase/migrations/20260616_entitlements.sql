-- Uprawnienia (zakupy) do płatnych agentów — np. „Behawiorysta PRO".
-- Jedyne źródło prawdy „kto co kupił". Zapis WYŁĄCZNIE przez service_role
-- (webhook Stripe). Klient (anon key) może tylko CZYTAĆ swoje wiersze.
-- Zastosowane na projekcie Supabase iythcbjjzwalyftxwswo (migracja: entitlements).

create table if not exists public.entitlements (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  agent_id           text not null,                 -- np. 'behaviorist-pro'
  source             text not null default 'stripe',
  stripe_session_id  text unique,                   -- idempotencja webhooka
  created_at         timestamptz not null default now(),
  unique (user_id, agent_id)
);

create index if not exists entitlements_user_id_idx on public.entitlements (user_id);

alter table public.entitlements enable row level security;

-- Użytkownik widzi tylko swoje uprawnienia (klient, anon key).
drop policy if exists entitlements_select_own on public.entitlements;
create policy entitlements_select_own on public.entitlements
  for select to authenticated
  using (auth.uid() = user_id);

-- Brak polityk INSERT/UPDATE/DELETE dla authenticated → zapis możliwy
-- tylko kluczem service_role (omija RLS), czyli wyłącznie z webhooka.
