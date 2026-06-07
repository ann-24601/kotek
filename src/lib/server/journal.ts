/* =============================================================
   Kotek — operacje serwerowe na danych właściciela.
   Wpisy (day_logs), kontekst behawiorysty oraz historia
   rozmów per dzień (chat_messages). Wszystko zawężone do userId.
   ============================================================= */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BehavioristContext } from "@/lib/behaviorist";
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
  return data as EntryRow;
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
