/* =============================================================
   Kotek — operacje serwerowe na danych właściciela.
   Wpisy (day_logs), kontekst behawiorysty oraz historia
   rozmów per dzień (chat_messages). Wszystko zawężone do userId.
   ============================================================= */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BehavioristContext } from "@/lib/behaviorist";
import { stripHtml } from "@/lib/html";
import { embed, toVectorLiteral } from "./embeddings";
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

export async function getEntry(
  sb: SupabaseClient,
  userId: string,
  date: string,
): Promise<EntryRow | null> {
  const { data, error } = await sb
    .from("day_logs")
    .select("date, metrics, note, updated_at")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return (data as EntryRow | null) ?? null;
}

export async function upsertEntry(
  sb: SupabaseClient,
  userId: string,
  date: string,
  metrics: DayMetrics,
  note: string | null,
): Promise<EntryRow> {
  const { data, error } = await sb
    .from("day_logs")
    .upsert(
      { user_id: userId, date, metrics, note, updated_at: new Date().toISOString() },
      { onConflict: "user_id,date" },
    )
    .select("date, metrics, note, updated_at")
    .single();
  if (error) throw error;

  // Indeksowanie wektorowe notatki (best-effort): nie może blokować zapisu.
  // Brakujące/nieudane embeddingi domyka skrypt backfill.
  await embedEntryNote(sb, userId, date, note).catch((err) =>
    console.error("upsertEntry embedding error:", err),
  );

  return data as EntryRow;
}

/**
 * Batchowy, nieniszczący zapis wpisów z UI (parytet z dawnym CatContext.saveLogs):
 * upsert tylko przekazanych dni (wraz ze `photos`), bez kasowania reszty historii.
 * Dodatkowo liczy embedding notatki — dzięki temu wpisy robione w aplikacji od razu
 * trafiają do wyszukiwania wektorowego (wcześniej widział je dopiero backfill).
 *
 * Embedding liczymy TYLKO dla dni, których treść notatki faktycznie się zmieniła —
 * ekran „dziś" re-wysyła całą historię przy każdym zapisie, więc bez tego filtra
 * generowalibyśmy embedding dla wszystkich notatek na każde kliknięcie „Zapisz".
 */
export async function upsertEntries(
  sb: SupabaseClient,
  userId: string,
  entries: DayLog[],
): Promise<void> {
  if (entries.length === 0) return;
  const dates = entries.map((e) => e.date);

  // Stan notatek sprzed zapisu — baza porównania „czy notatka się zmieniła".
  const { data: prevRows, error: prevErr } = await sb
    .from("day_logs")
    .select("date, note")
    .eq("user_id", userId)
    .in("date", dates);
  if (prevErr) throw prevErr;
  const prevNote = new Map<string, string>();
  for (const r of (prevRows as { date: string; note: string | null }[] | null) ?? []) {
    prevNote.set(r.date, stripHtml(r.note ?? ""));
  }

  const now = new Date().toISOString();
  const { error } = await sb.from("day_logs").upsert(
    entries.map((x) => ({
      user_id: userId,
      date: x.date,
      metrics: x.m,
      note: x.note ?? null,
      photos: x.photos ?? [],
      updated_at: now,
    })),
    { onConflict: "user_id,date" },
  );
  if (error) throw error;

  // Indeksowanie wektorowe (best-effort, równolegle): pojedyncze błędy nie wywracają
  // zapisu — domknie je skrypt backfill. Pusta notatka -> embedding NULL.
  await Promise.all(
    entries.map(async (x) => {
      const text = x.note ? stripHtml(x.note) : "";
      if (text === (prevNote.get(x.date) ?? "")) return; // bez zmian -> nie ruszamy embeddingu
      try {
        const embedding = text ? toVectorLiteral(await embed(text)) : null;
        const { error: upErr } = await sb
          .from("day_logs")
          .update({ embedding })
          .eq("user_id", userId)
          .eq("date", x.date);
        if (upErr) throw upErr;
      } catch (err) {
        console.error("upsertEntries embedding error:", x.date, err);
      }
    }),
  );
}

/**
 * Generuje i zapisuje embedding notatki wpisu (osobny update).
 * Puste/wyczyszczone notatki -> embedding NULL (wpis znika z ramienia wektorowego).
 */
async function embedEntryNote(
  sb: SupabaseClient,
  userId: string,
  date: string,
  note: string | null,
): Promise<void> {
  const text = note ? stripHtml(note) : "";
  const embedding = text ? toVectorLiteral(await embed(text)) : null;
  const { error } = await sb
    .from("day_logs")
    .update({ embedding })
    .eq("user_id", userId)
    .eq("date", date);
  if (error) throw error;
}

interface ProfileRow {
  profile: CatProfile | null;
  play_profile: PlayProfile | null;
  pillars: Pillars | null;
}
interface LogRow {
  date: string;
  metrics: DayMetrics | null;
  note: string | null;
}

/** Pełny kontekst behawiorysty (profil + wszystkie wpisy). */
export async function loadContext(
  sb: SupabaseClient,
  userId: string,
): Promise<BehavioristContext> {
  const [profRes, rowsRes] = await Promise.all([
    sb
      .from("cat_profiles")
      .select("profile, play_profile, pillars")
      .eq("user_id", userId)
      .maybeSingle(),
    sb
      .from("day_logs")
      .select("date, metrics, note")
      .eq("user_id", userId)
      .order("date", { ascending: true }),
  ]);
  if (profRes.error) throw profRes.error;
  if (rowsRes.error) throw rowsRes.error;

  const prof = profRes.data as ProfileRow | null;
  const logs: DayLog[] = ((rowsRes.data as LogRow[] | null) ?? []).map((r) => ({
    date: r.date,
    m: r.metrics ?? {},
    note: r.note ?? undefined,
  }));

  return {
    profile: prof?.profile ?? null,
    playProfile: prof?.play_profile ?? null,
    pillars: prof?.pillars ?? {},
    logs,
  };
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
