/* =============================================================
   Kotek — serwerowy klient Strapi (headless CMS na Railway).
   Strapi jest ŹRÓDŁEM PRAWDY treści wpisów (kolekcja `wpis`).
   TYLKO po stronie serwera: STRAPI_API_TOKEN to sekret full-access,
   nigdy nie wystawiaj go w przeglądarce. Zdjęcia trzymamy w
   Supabase Storage — tu w `photos` lądują tylko ścieżki (linki).
   ============================================================= */
import type { DayMetrics } from "@/lib/types";

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Brak zmiennej środowiskowej ${name}`);
  return v;
}

/** Bazowy URL instancji Strapi, bez końcowego ukośnika. */
export function strapiUrl(): string {
  return envOrThrow("STRAPI_API_URL").replace(/\/+$/, "");
}

/** Pojedynczy wpis w Strapi (spłaszczony kształt REST API v5). */
export interface WpisEntry {
  documentId: string;
  date: string;
  userId: string;
  note: string | null;
  metrics: DayMetrics;
  photos: string[];
}

interface StrapiItem {
  documentId: string;
  date: string;
  userId: string;
  note: string | null;
  metrics: DayMetrics | null;
  photos: string[] | null;
}

function toWpis(it: StrapiItem): WpisEntry {
  return {
    documentId: it.documentId,
    date: it.date,
    userId: it.userId,
    note: it.note ?? null,
    metrics: it.metrics ?? {},
    photos: Array.isArray(it.photos) ? it.photos : [],
  };
}

/** Niskopoziomowe wywołanie REST Strapi (ścieżka względem korzenia, np. "/api/wpisy"). */
async function strapiRequest<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = envOrThrow("STRAPI_API_TOKEN");
  const res = await fetch(`${strapiUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Strapi ${res.status} ${path}: ${await res.text()}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * Generyczny odczyt z REST API Strapi (ścieżka względem /api, np. "articles").
 * Pozostawiony dla treści innych niż wpisy. Cache 60 s.
 */
export async function strapiFetch<T = unknown>(
  path: string,
  opts: { query?: Record<string, string>; revalidate?: number } = {},
): Promise<T> {
  const token = envOrThrow("STRAPI_API_TOKEN");
  const qs = opts.query ? `?${new URLSearchParams(opts.query)}` : "";
  const url = `${strapiUrl()}/api/${path.replace(/^\/+/, "")}${qs}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: opts.revalidate ?? 60 },
  });
  if (!res.ok) {
    throw new Error(`Strapi ${res.status} dla ${path}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/* ----------------------- Wpisy dziennika ----------------------- */

/** Zwraca wpis danego użytkownika na dany dzień (albo null). */
export async function getWpis(
  userId: string,
  date: string,
): Promise<WpisEntry | null> {
  const q =
    `filters[userId][$eq]=${encodeURIComponent(userId)}` +
    `&filters[date][$eq]=${encodeURIComponent(date)}` +
    `&pagination[pageSize]=1`;
  const r = await strapiRequest<{ data: StrapiItem[] }>(`/api/wpisy?${q}`);
  return r.data[0] ? toWpis(r.data[0]) : null;
}

/** Wszystkie wpisy użytkownika, rosnąco po dacie (stronicowanie po 100). */
export async function listWpisy(userId: string): Promise<WpisEntry[]> {
  const out: WpisEntry[] = [];
  let page = 1;
  // bezpiecznik przeciw nieskończonej pętli
  for (let guard = 0; guard < 1000; guard++) {
    const q =
      `filters[userId][$eq]=${encodeURIComponent(userId)}` +
      `&sort=date:asc&pagination[page]=${page}&pagination[pageSize]=100`;
    const r = await strapiRequest<{
      data: StrapiItem[];
      meta: { pagination: { page: number; pageCount: number } };
    }>(`/api/wpisy?${q}`);
    out.push(...r.data.map(toWpis));
    if (page >= r.meta.pagination.pageCount || r.data.length === 0) break;
    page += 1;
  }
  return out;
}

export interface WpisInput {
  note: string | null;
  metrics: DayMetrics;
  photos: string[];
}

/** Tworzy wpis. */
export async function createWpis(
  userId: string,
  date: string,
  input: WpisInput,
): Promise<WpisEntry> {
  const r = await strapiRequest<{ data: StrapiItem }>(`/api/wpisy`, {
    method: "POST",
    body: JSON.stringify({ data: { userId, date, ...input } }),
  });
  return toWpis(r.data);
}

/** Aktualizuje wpis po documentId. */
export async function updateWpis(
  documentId: string,
  input: WpisInput,
): Promise<WpisEntry> {
  const r = await strapiRequest<{ data: StrapiItem }>(
    `/api/wpisy/${documentId}`,
    { method: "PUT", body: JSON.stringify({ data: input }) },
  );
  return toWpis(r.data);
}

/** Usuwa wpis po documentId. */
export async function deleteWpis(documentId: string): Promise<void> {
  await strapiRequest(`/api/wpisy/${documentId}`, { method: "DELETE" });
}

/**
 * Upsert po (userId, date): aktualizuje istniejący wpis albo tworzy nowy.
 * Zwraca aktualny stan wpisu. Synchronizacja Supabase (embedding/entry_index)
 * dzieje się przez lifecycle webhook Strapi, nie tutaj.
 */
export async function upsertWpis(
  userId: string,
  date: string,
  input: WpisInput,
): Promise<WpisEntry> {
  const existing = await getWpis(userId, date);
  return existing
    ? updateWpis(existing.documentId, input)
    : createWpis(userId, date, input);
}
