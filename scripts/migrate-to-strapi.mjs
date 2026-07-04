/* =============================================================
   Kotek — jednorazowa migracja wpisów day_logs (Supabase) → Strapi.
   - Tworzy w Strapi wpis dla każdego (user_id, date) z day_logs
     (note, metrics, photos[]). Idempotentnie: gdy wpis już istnieje,
     reużywa jego documentId (nie duplikuje).
   - Embedding NIE jest liczony ponownie — przenosimy istniejący wektor
     z day_logs.embedding wprost do pochodnego indeksu entry_index
     (wraz z linkiem strapi_document_id). Upsert po (user_id, date).
   - day_logs NIE jest ruszane (zostaje jako backup).

   Uruchom:  node scripts/migrate-to-strapi.mjs
   Wymaga zmiennych (czytane z procesu): NEXT_PUBLIC_SUPABASE_URL,
   SUPABASE_SERVICE_ROLE_KEY, STRAPI_API_URL, STRAPI_API_TOKEN.
   ============================================================= */
import { readFileSync } from "node:fs";

// --- wczytaj .env.local (proste parsowanie KEY=VALUE) ---
function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf-8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv(new URL("../.env.local", import.meta.url).pathname);

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRAPI = (process.env.STRAPI_API_URL || "").replace(/\/+$/, "");
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;
if (!SB_URL || !SRK || !STRAPI || !STRAPI_TOKEN) {
  console.error("Brak wymaganych zmiennych środowiskowych.");
  process.exit(1);
}

const sbHeaders = { apikey: SRK, Authorization: `Bearer ${SRK}` };
const stHeaders = {
  Authorization: `Bearer ${STRAPI_TOKEN}`,
  "Content-Type": "application/json",
};

// --- pobierz wszystkie day_logs ---
async function fetchDayLogs() {
  const url =
    `${SB_URL}/rest/v1/day_logs` +
    `?select=user_id,date,metrics,note,photos,embedding&order=date.asc`;
  const res = await fetch(url, { headers: sbHeaders });
  if (!res.ok) throw new Error(`Supabase day_logs ${res.status}: ${await res.text()}`);
  return res.json();
}

// --- znajdź istniejący wpis w Strapi (userId+date) ---
async function findWpis(userId, date) {
  const q =
    `filters[userId][$eq]=${encodeURIComponent(userId)}` +
    `&filters[date][$eq]=${encodeURIComponent(date)}&pagination[pageSize]=1`;
  const res = await fetch(`${STRAPI}/api/wpisy?${q}`, { headers: stHeaders });
  if (!res.ok) throw new Error(`Strapi find ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.data[0]?.documentId ?? null;
}

async function createWpis(userId, date, note, metrics, photos) {
  const res = await fetch(`${STRAPI}/api/wpisy`, {
    method: "POST",
    headers: stHeaders,
    body: JSON.stringify({ data: { userId, date, note, metrics, photos } }),
  });
  if (!res.ok) throw new Error(`Strapi create ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.data.documentId;
}

// --- upsert wiersza entry_index (z istniejącym embeddingiem) ---
async function upsertIndex(row) {
  const res = await fetch(
    `${SB_URL}/rest/v1/entry_index?on_conflict=user_id,date`,
    {
      method: "POST",
      headers: {
        ...sbHeaders,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    },
  );
  if (!res.ok) throw new Error(`entry_index upsert ${res.status}: ${await res.text()}`);
}

async function main() {
  const rows = await fetchDayLogs();
  console.log(`day_logs do migracji: ${rows.length}`);
  let created = 0,
    reused = 0,
    indexed = 0,
    withEmb = 0;

  for (const r of rows) {
    const note = r.note ?? null;
    const metrics = r.metrics ?? {};
    const photos = Array.isArray(r.photos) ? r.photos : [];

    let documentId = await findWpis(r.user_id, r.date);
    if (documentId) {
      reused++;
    } else {
      documentId = await createWpis(r.user_id, r.date, note, metrics, photos);
      created++;
    }

    const embedding = r.embedding ?? null; // string '[...]' albo null
    if (embedding) withEmb++;
    await upsertIndex({
      user_id: r.user_id,
      date: r.date,
      note,
      metrics,
      embedding,
      strapi_document_id: documentId,
      updated_at: new Date().toISOString(),
    });
    indexed++;
    if (indexed % 25 === 0) console.log(`  ...${indexed}/${rows.length}`);
  }

  console.log(
    `Gotowe. Strapi: utworzone=${created}, reużyte=${reused}. ` +
      `entry_index: wstawione=${indexed} (z embeddingiem=${withEmb}).`,
  );
}

main().catch((err) => {
  console.error("MIGRACJA NIEUDANA:", err);
  process.exit(1);
});
