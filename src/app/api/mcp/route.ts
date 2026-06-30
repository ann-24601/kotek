/* =============================================================
   Kotek — Remote HTTP MCP server (Streamable HTTP).
   Wystawia dziennik kota agentom AI jako narzędzia MCP:
   add_entry (upsert wpisu), get_entry (odczyt) i search_entries
   (wyszukiwanie hybrydowe: wektor + keyword, RRF).
   Pakiet: mcp-handler (wzorzec Vercela). Autoryzacja osobistym
   tokenem (per-user) co API v1 — przez withMcpAuth. Reużywa
   helperów serwerowych z src/lib/server/*.
   ============================================================= */
import { z } from "zod";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { adminClient } from "@/lib/server/admin";
import { resolveBearerUser } from "@/lib/server/auth";
import { validateMetrics } from "@/lib/server/metrics";
import { getEntry, upsertEntry } from "@/lib/server/journal";
import { hybridSearch, type MetricFilters } from "@/lib/server/search";

export const runtime = "nodejs";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const today = () => new Date().toISOString().slice(0, 10);

/** Filtr pojedynczej metryki: dolny i/lub górny próg (włącznie). */
const METRIC_FILTER = z.object({
  min: z.number().int().optional(),
  max: z.number().int().optional(),
});

/** userId właściciela danych — z tokenu osobistego (ustawiany w verifyToken). */
function ownerId(extra?: { authInfo?: AuthInfo }): string {
  const fromAuth = extra?.authInfo?.extra?.userId;
  if (typeof fromAuth !== "string") throw new Error("Brak userId w kontekście autoryzacji MCP.");
  return fromAuth;
}

/** Pomocniczo: zawartość tekstowa MCP z obiektu JSON. */
function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "add_entry",
      "Dodaj lub zaktualizuj (upsert) wpis dziennika kota na dany dzień (domyślnie dziś). " +
        "Metryki to liczby całkowite: aktywnosc 0–3, apetyt 0–2, vocal 0–5, zabawa 0–2.",
      {
        date: z
          .string()
          .regex(ISO_DATE, "Format YYYY-MM-DD")
          .optional()
          .describe("Dzień wpisu YYYY-MM-DD. Domyślnie dziś."),
        metrics: z
          .object({
            aktywnosc: z.number().int().min(0).max(3),
            apetyt: z.number().int().min(0).max(2),
            vocal: z.number().int().min(0).max(5),
            zabawa: z.number().int().min(0).max(2),
          })
          .describe("Cztery metryki dnia (liczby całkowite)."),
        note: z
          .string()
          .nullish()
          .describe("Notatka jako HTML, np. <p>...</p>. Opcjonalna."),
      },
      async ({ date, metrics, note }, extra) => {
        const day = date ?? today();
        const v = validateMetrics(metrics);
        if ("error" in v) return fail(v.error);
        const cleanNote = typeof note === "string" && note.trim() ? note : null;
        try {
          const entry = await upsertEntry(adminClient(), ownerId(extra), day, v.metrics, cleanNote);
          return json({ ok: true, entry });
        } catch (err) {
          console.error("mcp add_entry error:", err);
          return fail("Zapis nieudany.");
        }
      },
    );

    server.tool(
      "get_entry",
      "Odczytaj wpis dziennika kota na dany dzień (domyślnie dziś). " +
        "Gdy wpisu nie ma — entry jest null.",
      {
        date: z
          .string()
          .regex(ISO_DATE, "Format YYYY-MM-DD")
          .optional()
          .describe("Dzień YYYY-MM-DD. Domyślnie dziś."),
      },
      async ({ date }, extra) => {
        const day = date ?? today();
        try {
          const entry = await getEntry(adminClient(), ownerId(extra), day);
          return json({ ok: true, entry });
        } catch (err) {
          console.error("mcp get_entry error:", err);
          return fail("Odczyt nieudany.");
        }
      },
    );

    server.tool(
      "search_entries",
      "Wyszukaj wpisy dziennika kota pasujące do zapytania (hybrydowo: " +
        "podobieństwo znaczeniowe + słowa kluczowe, łączone metodą RRF). " +
        "Zwraca najtrafniejsze wpisy (domyślnie do 30) z datą, notatką i metrykami. " +
        "Opcjonalnie zawęź po metrykach (min/max): aktywnosc 0–3, apetyt 0–2, vocal 0–5, zabawa 0–2.",
      {
        query: z.string().min(1).describe("Czego szukać, np. 'wymioty po jedzeniu'."),
        filters: z
          .object({
            aktywnosc: METRIC_FILTER.optional(),
            apetyt: METRIC_FILTER.optional(),
            vocal: METRIC_FILTER.optional(),
            zabawa: METRIC_FILTER.optional(),
          })
          .partial()
          .optional()
          .describe("Opcjonalne filtry po metrykach (min/max, włącznie)."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Maks. liczba wyników. Domyślnie 30."),
      },
      async ({ query, filters, limit }, extra) => {
        try {
          const hits = await hybridSearch(adminClient(), ownerId(extra), {
            query,
            filters: filters as MetricFilters | undefined,
            limit,
          });
          return json({ ok: true, count: hits.length, hits });
        } catch (err) {
          console.error("mcp search_entries error:", err);
          return fail("Wyszukiwanie nieudane.");
        }
      },
    );
  },
  {},
  { basePath: "/api" },
);

/** Weryfikacja Bearer tokenu — token osobisty (per-user) jak w REST API. */
async function verifyToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;
  const userId = await resolveBearerUser(bearerToken);
  if (!userId) return undefined;
  return {
    token: bearerToken,
    scopes: [],
    clientId: "kotek",
    extra: { userId },
  };
}

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
