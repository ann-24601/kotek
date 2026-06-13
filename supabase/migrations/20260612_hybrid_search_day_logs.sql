-- Wyszukiwanie hybrydowe w day_logs: FTS (keyword) + wektor, łączone przez RRF.
-- Zastosowane na projekcie Supabase iythcbjjzwalyftxwswo (migracja: hybrid_search_day_logs).
-- Kopia w repo dla śladu wersjonowania.

-- 1) FTS po polsku: 'simple' + unaccent (brak słownika PL w Postgres/Supabase).
create extension if not exists unaccent with schema extensions;

-- immutable wrapper (unaccent samo w sobie nie jest immutable -> nie wejdzie do kolumny generowanej)
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
set search_path = extensions, public
as $$
  select extensions.unaccent('extensions.unaccent', $1)
$$;

-- kolumna tsvector generowana z czystego tekstu notatki + indeks GIN
alter table public.day_logs
  add column if not exists note_tsv tsvector
  generated always as (to_tsvector('simple', public.f_unaccent(coalesce(note, '')))) stored;

create index if not exists day_logs_note_tsv_gin
  on public.day_logs using gin (note_tsv);

-- 2) Indeks wektorowy (cosine) na istniejącej kolumnie embedding
create index if not exists day_logs_embedding_hnsw
  on public.day_logs using hnsw (embedding extensions.vector_cosine_ops);

-- 3) RPC: hybryda top-N(vec) + top-N(kw) -> RRF
create or replace function public.hybrid_search_day_logs(
  p_user_id uuid,
  p_query_text text,
  p_query_embedding text,
  p_match_count int default 30,
  p_rrf_k int default 60,
  p_filters jsonb default '{}'::jsonb
)
returns table (
  date date,
  note text,
  metrics jsonb,
  vrank int,
  krank int,
  rrf double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with filtered as (
    select d.date, d.note, d.metrics, d.embedding, d.note_tsv
    from public.day_logs d
    where d.user_id = p_user_id
      -- filtry metryk: {"aktywnosc":{"min":2,"max":3},"vocal":{"max":1}, ...}
      and (p_filters->'aktywnosc'->>'min' is null or (d.metrics->>'aktywnosc')::int >= (p_filters->'aktywnosc'->>'min')::int)
      and (p_filters->'aktywnosc'->>'max' is null or (d.metrics->>'aktywnosc')::int <= (p_filters->'aktywnosc'->>'max')::int)
      and (p_filters->'apetyt'->>'min'   is null or (d.metrics->>'apetyt')::int   >= (p_filters->'apetyt'->>'min')::int)
      and (p_filters->'apetyt'->>'max'   is null or (d.metrics->>'apetyt')::int   <= (p_filters->'apetyt'->>'max')::int)
      and (p_filters->'vocal'->>'min'    is null or (d.metrics->>'vocal')::int    >= (p_filters->'vocal'->>'min')::int)
      and (p_filters->'vocal'->>'max'    is null or (d.metrics->>'vocal')::int    <= (p_filters->'vocal'->>'max')::int)
      and (p_filters->'zabawa'->>'min'   is null or (d.metrics->>'zabawa')::int   >= (p_filters->'zabawa'->>'min')::int)
      and (p_filters->'zabawa'->>'max'   is null or (d.metrics->>'zabawa')::int   <= (p_filters->'zabawa'->>'max')::int)
  ),
  vec as (
    select f.date,
           row_number() over (order by f.embedding <=> p_query_embedding::extensions.vector) as vrank
    from filtered f
    where f.embedding is not null
      and coalesce(p_query_embedding, '') <> ''
    order by f.embedding <=> p_query_embedding::extensions.vector
    limit p_match_count
  ),
  kw as (
    select f.date,
           row_number() over (order by ts_rank(f.note_tsv, q) desc) as krank
    from filtered f,
         websearch_to_tsquery('simple', public.f_unaccent(coalesce(p_query_text, ''))) as q
    where coalesce(p_query_text, '') <> ''
      and f.note_tsv @@ q
    order by ts_rank(f.note_tsv, q) desc
    limit p_match_count
  )
  select f.date,
         f.note,
         f.metrics,
         v.vrank::int,
         k.krank::int,
         coalesce(1.0 / (p_rrf_k + v.vrank), 0) + coalesce(1.0 / (p_rrf_k + k.krank), 0) as rrf
  from vec v
  full join kw k using (date)
  join filtered f using (date)
  order by rrf desc
  limit p_match_count
$$;

revoke all on function public.hybrid_search_day_logs(uuid, text, text, int, int, jsonb) from public, anon;
grant execute on function public.hybrid_search_day_logs(uuid, text, text, int, int, jsonb) to service_role;
