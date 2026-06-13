/* =============================================================
   Kotek — wyszukiwanie hybrydowe po wpisach dziennika.
   Łączy ramię wektorowe (embedding notatki) z klasycznym FTS
   (note_tsv) przez RRF po stronie bazy (RPC hybrid_search_day_logs).
   Opcjonalne filtry po metrykach. Wynik zawsze zawężony do userId.
   ============================================================= */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DayMetrics } from "@/lib/types";
import { stripHtml } from "@/lib/html";
import { embed, toVectorLiteral } from "./embeddings";

/** Filtr pojedynczej metryki: dolny i/lub górny próg (włącznie). */
export interface MetricFilter {
  min?: number;
  max?: number;
}

/** Filtry po metrykach dnia — klucze jak w DayMetrics. */
export type MetricFilters = Partial<Record<keyof DayMetrics, MetricFilter>>;

export interface HybridSearchParams {
  query: string;
  /** Filtry strukturalne po metrykach (np. { vocal: { min: 3 } }). */
  filters?: MetricFilters;
  /** Maksymalna liczba wyników (i rozmiar top-N każdego ramienia). Domyślnie 30. */
  limit?: number;
}

export interface HybridSearchHit {
  date: string;
  /** Notatka jako czysty tekst (HTML TipTap oczyszczony). */
  note: string;
  metrics: DayMetrics;
  /** Pozycja w rankingu wektorowym (null, gdy trafienie tylko keyword). */
  vrank: number | null;
  /** Pozycja w rankingu keyword (null, gdy trafienie tylko wektorowe). */
  krank: number | null;
  /** Łączny wynik RRF (malejąco). */
  rrf: number;
}

interface RpcRow {
  date: string;
  note: string | null;
  metrics: DayMetrics | null;
  vrank: number | null;
  krank: number | null;
  rrf: number;
}

/**
 * Wyszukiwanie hybrydowe: top-N wektorowe + top-N keyword, scalone RRF.
 * Zwraca wpisy uszeregowane malejąco wg trafności (rrf).
 */
export async function hybridSearch(
  sb: SupabaseClient,
  userId: string,
  params: HybridSearchParams,
): Promise<HybridSearchHit[]> {
  const query = params.query.trim();
  const limit = params.limit ?? 30;

  // Embedding zapytania (ramię wektorowe). Gdy zapytanie puste — bez wektora.
  let embeddingLiteral = "";
  if (query) {
    embeddingLiteral = toVectorLiteral(await embed(query));
  }

  const { data, error } = await sb.rpc("hybrid_search_day_logs", {
    p_user_id: userId,
    p_query_text: query,
    p_query_embedding: embeddingLiteral,
    p_match_count: limit,
    p_filters: (params.filters ?? {}) as Record<string, unknown>,
  });
  if (error) throw error;

  return ((data as RpcRow[] | null) ?? []).map((r) => ({
    date: r.date,
    note: r.note ? stripHtml(r.note) : "",
    metrics: r.metrics ?? {},
    vrank: r.vrank,
    krank: r.krank,
    rrf: r.rrf,
  }));
}
