/* =============================================================
   Kotek — backfill embeddingów dla day_logs.
   Uzupełnia kolumnę embedding dla wierszy z notatką, ale bez
   embeddingu (np. historyczne wpisy lub takie, dla których
   generowanie przy zapisie się nie powiodło). Idempotentny.

   Uruchomienie (z katalogu kotek):
     npx tsx scripts/backfill-embeddings.ts
   Czyta zmienne z .env.local (NEXT_PUBLIC_SUPABASE_URL,
   SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY).
   ============================================================= */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Minimalny loader .env.local (skrypt CLI nie korzysta z ładowania env Next.js).
function loadEnv(file: string): void {
  let raw: string;
  try {
    raw = readFileSync(resolve(process.cwd(), file), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnv(".env.local");

// Importy po załadowaniu env (adminClient/embed czytają process.env).
async function main() {
  // Node < 22 nie ma globalnego WebSocket — supabase-js (realtime) tego wymaga.
  // Dotyczy tylko tego skryptu CLI; w runtime Next.js nie jest potrzebne.
  if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === "undefined") {
    const ws = await import("ws");
    (globalThis as { WebSocket?: unknown }).WebSocket = ws.default;
  }

  const { adminClient } = await import("../src/lib/server/admin");
  const { embed, toVectorLiteral } = await import("../src/lib/server/embeddings");
  const { stripHtml } = await import("../src/lib/html");

  const sb = adminClient();

  const { data, error } = await sb
    .from("day_logs")
    .select("user_id, date, note")
    .is("embedding", null)
    .not("note", "is", null);
  if (error) throw error;

  const rows = (data ?? []) as { user_id: string; date: string; note: string | null }[];
  console.log(`Wierszy do uzupełnienia: ${rows.length}`);

  let done = 0;
  for (const r of rows) {
    const text = r.note ? stripHtml(r.note) : "";
    if (!text) continue;
    try {
      const embedding = toVectorLiteral(await embed(text));
      const upd = await sb
        .from("day_logs")
        .update({ embedding })
        .eq("user_id", r.user_id)
        .eq("date", r.date);
      if (upd.error) throw upd.error;
      done += 1;
      console.log(`  ✓ ${r.date}`);
    } catch (err) {
      console.error(`  ✗ ${r.date}:`, err);
    }
  }
  console.log(`Gotowe. Uzupełniono ${done}/${rows.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
