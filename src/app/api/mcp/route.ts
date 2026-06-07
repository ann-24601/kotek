/* =============================================================
   Kotek — Remote HTTP MCP server (Streamable HTTP).
   Wystawia dziennik kota agentom AI jako narzędzia MCP:
   add_entry (upsert wpisu) i get_entry (odczyt).
   Pakiet: mcp-handler (wzorzec Vercela). Autoryzacja tym samym
   Bearer tokenem co API v1 (KOTEK_API_TOKEN) przez withMcpAuth.
   Reużywa helperów serwerowych z src/lib/server/*.
   ============================================================= */
import { z } from "zod";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { adminClient, envOrThrow } from "@/lib/server/admin";
import { checkToken } from "@/lib/server/auth";
import { validateMetrics } from "@/lib/server/metrics";
import { getEntry, upsertEntry } from "@/lib/server/journal";

export const runtime = "nodejs";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const today = () => new Date().toISOString().slice(0, 10);

/** userId właściciela danych (app jednoużytkownikowa). */
function ownerId(extra?: { authInfo?: AuthInfo }): string {
  const fromAuth = extra?.authInfo?.extra?.userId;
  return typeof fromAuth === "string" ? fromAuth : envOrThrow("KOTEK_USER_ID");
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
  },
  {},
  { basePath: "/api" },
);

/** Weryfikacja Bearer tokenu — ten sam KOTEK_API_TOKEN co REST API. */
async function verifyToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken || !checkToken(bearerToken)) return undefined;
  return {
    token: bearerToken,
    scopes: [],
    clientId: "kotek",
    extra: { userId: envOrThrow("KOTEK_USER_ID") },
  };
}

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
