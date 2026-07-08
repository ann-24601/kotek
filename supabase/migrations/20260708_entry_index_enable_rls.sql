-- Włączenie RLS na pochodnym indeksie wyszukiwania.
-- Security Advisor: "RLS Disabled in Public" na public.entry_index.
-- Bez polityk celowo: cały dostęp idzie serwerowo przez service_role (omija RLS),
-- a RPC public.hybrid_search_entries jest security definer. Żaden klient (anon)
-- nie czyta tej tabeli bezpośrednio, więc brak polityk = pełna blokada dla anon/authenticated.
-- Zastosowane na projekcie iythcbjjzwalyftxwswo przez SQL Editor 2026-07-08; ta migracja domyka repo.

alter table public.entry_index enable row level security;
