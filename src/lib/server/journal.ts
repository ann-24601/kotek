/* =============================================================
   Kotek — operacje serwerowe na danych właściciela.
   ŹRÓDŁO PRAWDY wpisów (kolekcja `wpis`) to Strapi — odczyt/zapis
   idzie przez REST Strapi. Pochodny indeks wyszukiwania w Supabase
   (entry_index: embedding + note + metrics + link) aktualizuje
   wyłącznie lifecycle webhook Strapi (zob. /api/strapi-sync), więc
   te funkcje NIE liczą już embeddingów.
   Profil kota i historia rozmów (chat_messages) zostają w Supabase.
   ============================================================= */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BehavioristContext } from "@/lib/behaviorist";
import {
  getWpis,
  listWpisy,
  upsertWpis,
  type WpisEntry,
} from "./strapi";
import type {
  CatProfile,
  ChatMessage,
  DayLog,
  DayMetrics,
  Pillars,
  PlayProfile,
} from "@/lib/types";

export interface EntryRow {
  date: string;
  metrics: DayMetrics;
  note: string | null;
  updated_at: string;
}

function toEntryRow(w: WpisEntry): EntryRow {
  return {
    date: w.date,
    metrics: w.metrics ?? {},
    note: w.note ?? null,
    updated_at: new Date().toISOString(),
  };
}

/** Odczyt wpisu na dany dzień (ze Strapi). */
export async function getEntry(
  _sb: SupabaseClient,
  userId: string,
  date: string,
): Promise<EntryRow | null> {
  const w = await getWpis(userId, date);
  return w ? toEntryRow(w) : null;
}

/**
 * Upsert pojedynczego wpisu (API v1 / MCP) — zapis do Strapi.
 * Zachowuje istniejące zdjęcia (te funkcje nie zmieniają zdjęć).
 */
export async function upsertEntry(
  _sb: SupabaseClient,
  userId: string,
  date: string,
  metrics: DayMetrics,
  note: string | null,
): Promise<EntryRow> {
  const existing = await getWpis(userId, date);
  const w = await upsertWpis(userId, date, {
    note,
    metrics,
    photos: existing?.photos ?? [],
  });
  return toEntryRow(w);
}

/** Czy dwa wpisy są treściowo identyczne (note + metrics + photos). */
function sameContent(
  a: { note: string | null; metrics: DayMetrics; photos: string[] },
  b: { note: string | null; metrics: DayMetrics; photos: string[] },
): boolean {
  return (
    (a.note ?? "") === (b.note ?? "") &&
    JSON.stringify(a.metrics ?? {}) === JSON.stringify(b.metrics ?? {}) &&
    JSON.stringify(a.photos ?? []) === JSON.stringify(b.photos ?? [])
  );
}

/**
 * Batchowy, nieniszczący zapis wpisów z UI (parytet z dawnym saveLogs).
 * Ekran „dziś" re-wysyła całą historię przy każdym zapisie, więc piszemy
 * do Strapi TYLKO dni, których treść faktycznie się zmieniła — inaczej
 * generowalibyśmy zbędne zapisy i lawinę webhooków sync.
 */
export async function upsertEntries(
  _sb: SupabaseClient,
  userId: string,
  entries: DayLog[],
): Promise<void> {
  if (entries.length === 0) return;

  // Stan w Strapi jako baza porównania.
  const current = await listWpisy(userId);
  const byDate = new Map<string, WpisEntry>();
  for (const w of current) byDate.set(w.date, w);

  for (const e of entries) {
    const desired = {
      note: e.note ?? null,
      metrics: e.m ?? {},
      photos: e.photos ?? [],
    };
    const prev = byDate.get(e.date);
    if (prev && sameContent(prev, desired)) continue; // bez zmian -> pomijamy
    await upsertWpis(userId, e.date, desired);
  }
}

interface ProfileRow {
  profile: CatProfile | null;
  play_profile: PlayProfile | null;
  pillars: Pillars | null;
}

/** Pełny kontekst behawiorysty: profil (Supabase) + wszystkie wpisy (Strapi). */
export async function loadContext(
  sb: SupabaseClient,
  userId: string,
): Promise<BehavioristContext> {
  const [profRes, wpisy] = await Promise.all([
    sb
      .from("cat_profiles")
      .select("profile, play_profile, pillars")
      .eq("user_id", userId)
      .maybeSingle(),
    listWpisy(userId),
  ]);
  if (profRes.error) throw profRes.error;

  const prof = profRes.data as ProfileRow | null;
  const logs: DayLog[] = wpisy.map((w) => ({
    date: w.date,
    m: w.metrics ?? {},
    note: w.note ?? undefined,
  }));

  return {
    profile: prof?.profile ?? null,
    playProfile: prof?.play_profile ?? null,
    pillars: prof?.pillars ?? {},
    logs,
  };
}

/** Wszystkie wpisy użytkownika jako DayLog[] (dla klienta — ekran dziennika). */
export async function listEntries(userId: string): Promise<DayLog[]> {
  const wpisy = await listWpisy(userId);
  return wpisy.map((w) => ({
    date: w.date,
    m: w.metrics ?? {},
    note: w.note ?? undefined,
    photos: w.photos ?? [],
  }));
}

/** Historia rozmowy z agentem dla danego dnia (rosnąco). */
export async function getDayHistory(
  sb: SupabaseClient,
  userId: string,
  date: string,
): Promise<ChatMessage[]> {
  const { data, error } = await sb
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ChatMessage[] | null) ?? [];
}

/** Dopisuje wiadomości do wątku danego dnia. */
export async function appendDayMessages(
  sb: SupabaseClient,
  userId: string,
  date: string,
  msgs: ChatMessage[],
): Promise<void> {
  const rows = msgs.map((m) => ({
    user_id: userId,
    date,
    role: m.role,
    content: m.content,
  }));
  const { error } = await sb.from("chat_messages").insert(rows);
  if (error) throw error;
}
