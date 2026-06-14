-- Zabezpieczenie funkcji hybrid_search_day_logs (SECURITY DEFINER).
-- Problem: domyślny EXECUTE dla PUBLIC/anon/authenticated pozwalał dowolnemu
-- klientowi wywołać RPC z cudzym p_user_id i odczytać notatki innych użytkowników
-- (funkcja DEFINER omija RLS). Funkcja ma być wołana TYLKO po stronie serwera
-- kluczem service_role. Odbieramy więc EXECUTE rolom publicznym i zostawiamy
-- je wyłącznie service_role.
revoke execute on function public.hybrid_search_day_logs(uuid, text, text, integer, integer, jsonb)
  from public, anon, authenticated;

grant execute on function public.hybrid_search_day_logs(uuid, text, text, integer, integer, jsonb)
  to service_role;
