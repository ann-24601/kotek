-- Cutover na Strapi: Supabase staje się pochodnym indeksem wyszukiwania.
-- Strapi = źródło prawdy treści wpisu; tu trzymamy embedding + kopię note/metrics
-- (potrzebne do FTS i filtrów) + link do wpisu w Strapi (strapi_document_id).
-- Stara tabela day_logs ZOSTAJE nietknięta jako backup (usuniemy później).
-- Zastosowane na projekcie Supabase iythcbjjzwalyftxwswo (migracja: entry_index_strapi).

-- 1) Tabela indeksu wyszukiwania (read-model synchronizowany z webhooka Strapi).
create table if not exists public.entry_index (
  user_id uuid not null,
  date date not null,
  note text,
  metrics jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1536),
  strapi_document_id text,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create unique index if not exists entry_index_strapi_doc_uniq
  on public.entry_index (strapi_document_id)
  where strapi_document_id is not null;

-- 2) FTS: kolumna tsvector generowana (reużywamy public.f_unaccent z migracji hybrid_search).
alter table public.entry_index
  add column if not exists note_tsv tsvector
  generated always as (to_tsvector('simple', public.f_unaccent(coalesce(note, '')))) stored;

create index if not exists entry_index_note_tsv_gin
  on public.entry_index using gin (note_tsv);

-- 3) Indeks wektorowy (cosine).
create index if not exists entry_index_embedding_hnsw
  on public.entry_index using hnsw (embedding extensions.vector_cosine_ops);

-- 4) RPC hybryda (kopia hybrid_search_day_logs, czyta z entry_index).
create or replace function public.hybrid_search_entries(
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
  strapi_document_id text,
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
    select d.date, d.note, d.metrics, d.strapi_document_id, d.embedding, d.note_tsv
    from public.entry_index d
    where d.user_id = p_user_id
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
         f.strapi_document_id,
         v.vrank::int,
         k.krank::int,
         coalesce(1.0 / (p_rrf_k + v.vrank), 0) + coalesce(1.0 / (p_rrf_k + k.krank), 0) as rrf
  from vec v
  full join kw k using (date)
  join filtered f using (date)
  order by rrf desc
  limit p_match_count
$$;

revoke all on function public.hybrid_search_entries(uuid, text, text, int, int, jsonb) from public, anon;
grant execute on function public.hybrid_search_entries(uuid, text, text, int, int, jsonb) to service_role;
