-- Rate limiting per klucz (token/user/IP) dla endpointów serwerowych.
-- Chroni przed nadużyciem kosztów (OpenAI) przy wycieku osobistego tokenu.
-- Fixed-window counter w Postgresie — działa spójnie na serverless (współdzielony
-- stan, w przeciwieństwie do liczników w pamięci instancji). Cały dostęp przez
-- service_role. Zastosowane na projekcie Supabase iythcbjjzwalyftxwswo (migracja: rate_limits).

create table if not exists public.rate_limits (
  key          text primary key,           -- np. 'ask:<userId>' albo 'ip:<addr>'
  count        int not null default 0,      -- liczba żądań w bieżącym oknie
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
-- Świadomie BRAK polityk dla anon/authenticated — tabela dotykalna wyłącznie service_role'em.

-- Atomowo: zwiększ licznik w oknie (albo zresetuj, gdy okno minęło) i zwróć werdykt.
-- Pojedynczy INSERT ... ON CONFLICT jest atomowy, więc brak wyścigów między żądaniami.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns table(allowed boolean, remaining int, reset_at timestamptz)
language plpgsql
as $$
declare
  v_now          timestamptz := now();
  v_count        int;
  v_window_start timestamptz;
begin
  insert into public.rate_limits as rl (key, count, window_start)
  values (p_key, 1, v_now)
  on conflict (key) do update
    set count = case
          when rl.window_start < v_now - make_interval(secs => p_window_seconds)
            then 1
            else rl.count + 1
          end,
        window_start = case
          when rl.window_start < v_now - make_interval(secs => p_window_seconds)
            then v_now
            else rl.window_start
          end
  returning rl.count, rl.window_start into v_count, v_window_start;

  return query
    select
      v_count <= p_limit,
      greatest(p_limit - v_count, 0),
      v_window_start + make_interval(secs => p_window_seconds);
end;
$$;

-- Tylko serwer (service_role) może wołać licznik.
revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
