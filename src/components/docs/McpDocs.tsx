/* =============================================================
   Kotek — zakładka „MCP" dokumentacji.
   Remote HTTP MCP server (Streamable HTTP) hostowany na Vercel.
   Configi klientów i przykłady podstawiają token z paska.
   ============================================================= */
import { Badge, Code, Field } from "./primitives";

const MCP_URL = "https://kotek-nu.vercel.app/api/mcp";

export default function McpDocs({ token }: { token: string }) {
  const bearer = token || "<TWÓJ_TOKEN>";

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8 lg:px-8 lg:py-12">
      <div className="flex items-center gap-3">
        <Badge>MCP</Badge>
        <span className="font-hand text-sm text-ink-faint">Remote HTTP · Streamable HTTP</span>
      </div>
      <h1 className="mt-3 text-[2rem]">Kotek MCP</h1>
      <p className="mt-3 text-ink-soft">
        Serwer <strong>MCP (Model Context Protocol)</strong> daje agentom AI bezpośredni dostęp do
        dziennika kota — bez pisania własnego klienta API. To <strong>Remote HTTP MCP</strong>
        (transport Streamable HTTP) hostowany na Vercel. Wystarczy podać adres serwera i token,
        a klient (Claude, Cursor, …) sam wykryje dostępne narzędzia.
      </p>
      <p className="mt-3 text-ink-soft">Adres serwera:</p>
      <Code>{MCP_URL}</Code>

      {/* SETUP / AUTORYZACJA */}
      <section id="mcp-setup" className="mt-12 scroll-mt-6">
        <h2 className="text-2xl">Autoryzacja</h2>
        <p className="mt-2 text-ink-soft">
          Serwer chroniony jest tym samym Personal Access Token co REST API. Klient wysyła go w
          nagłówku <code>Authorization</code>. Bez tokenu lub ze złym tokenem połączenie jest
          odrzucane (<code>401</code>). Wklej swój token w pasku u góry, a poniższe configi
          podstawią go automatycznie.
        </p>
        <Code>{`Authorization: Bearer ${bearer}`}</Code>
      </section>

      {/* CONNECT */}
      <section id="mcp-connect" className="mt-12 scroll-mt-6">
        <h2 className="text-2xl">Podłączenie klienta</h2>

        <h3 className="mt-5 text-lg">Cursor</h3>
        <p className="mt-2 text-ink-soft">
          Dodaj serwer do <code>.cursor/mcp.json</code> w projekcie (transport Streamable HTTP):
        </p>
        <Code>{`{
  "mcpServers": {
    "kotek": {
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer ${bearer}"
      }
    }
  }
}`}</Code>

        <h3 className="mt-5 text-lg">Claude (Desktop / claude.ai)</h3>
        <p className="mt-2 text-ink-soft">
          Dodaj <strong>custom connector</strong> typu Remote MCP: jako URL podaj adres serwera,
          a w nagłówkach ustaw <code>Authorization: Bearer …</code> z tym samym tokenem.
        </p>
        <Code>{`URL:  ${MCP_URL}
Nagłówek:  Authorization: Bearer ${bearer}`}</Code>

        <h3 className="mt-5 text-lg">Test lokalny (MCP Inspector)</h3>
        <p className="mt-2 text-ink-soft">
          Najszybszy sposób sprawdzenia narzędzi bez podłączania klienta:
        </p>
        <Code>{`npx @modelcontextprotocol/inspector`}</Code>
        <p className="mt-2 text-ink-soft">
          W inspektorze wybierz <strong>Streamable HTTP</strong>, wklej adres serwera oraz nagłówek
          <code> Authorization</code>, a następnie <em>List Tools</em>.
        </p>
      </section>

      {/* TOOLS */}
      <section id="mcp-tools" className="mt-12 scroll-mt-6">
        <h2 className="text-2xl">Narzędzia</h2>
        <p className="mt-2 text-ink-soft">
          Serwer wystawia dwa narzędzia do obsługi wpisów dziennika. Mapują się 1:1 na endpointy
          REST <code>POST</code>/<code>GET /api/v1/entries</code>.
        </p>

        {/* add_entry */}
        <div className="mt-6 rounded-[var(--r-box)] border-2 border-ink p-5">
          <div className="flex items-center gap-3">
            <Badge>tool</Badge>
            <code className="text-[0.95rem] font-semibold">add_entry</code>
          </div>
          <p className="mt-2 text-ink-soft">
            Dodaje lub aktualizuje (upsert) wpis dziennika na dany dzień. Domyślnie dziś.
          </p>
          <h4 className="mt-4 font-hand text-base font-semibold">Parametry</h4>
          <ul className="mt-2">
            <Field name="date" type="string · opcjonalne">
              Dzień wpisu <code>YYYY-MM-DD</code>. Domyślnie dziś.
            </Field>
            <Field name="metrics" type="object · wymagane">
              Cztery metryki (liczby całkowite):
              <ul className="mt-1.5 list-disc pl-5">
                <li><code>aktywnosc</code> 0–3 — Brak / Mało / Jak zwykle / Dużo</li>
                <li><code>apetyt</code> 0–2 — Mniej / Jak zwykle / Więcej</li>
                <li><code>vocal</code> 0–5 — Mniej / Jak zwykle / Więcej / Nocne / Pod drzwiami / O jedzenie</li>
                <li><code>zabawa</code> 0–2 — Brak / Krótko / Dobra sesja</li>
              </ul>
            </Field>
            <Field name="note" type="string | null · opcjonalne">
              Notatka jako HTML, np. <code>{`<p>...</p>`}</code>.
            </Field>
          </ul>
          <h4 className="mt-4 font-hand text-base font-semibold">Przykładowe wywołanie</h4>
          <Code>{`{
  "date": "2026-06-07",
  "metrics": { "aktywnosc": 3, "apetyt": 1, "vocal": 2, "zabawa": 2 },
  "note": "<p>Dużo biegał, świetna sesja zabawy.</p>"
}`}</Code>
          <h4 className="mt-4 font-hand text-base font-semibold">Wynik</h4>
          <Code>{`{
  "ok": true,
  "entry": {
    "date": "2026-06-07",
    "metrics": { "aktywnosc": 3, "apetyt": 1, "vocal": 2, "zabawa": 2 },
    "note": "<p>Dużo biegał, świetna sesja zabawy.</p>",
    "updated_at": "2026-06-07T18:55:46.159+00:00"
  }
}`}</Code>
        </div>

        {/* get_entry */}
        <div className="mt-6 rounded-[var(--r-box)] border-2 border-ink p-5">
          <div className="flex items-center gap-3">
            <Badge>tool</Badge>
            <code className="text-[0.95rem] font-semibold">get_entry</code>
          </div>
          <p className="mt-2 text-ink-soft">
            Zwraca wpis dziennika na dany dzień. Domyślnie dziś. Gdy wpisu nie ma —{" "}
            <code>entry</code> jest <code>null</code>.
          </p>
          <h4 className="mt-4 font-hand text-base font-semibold">Parametry</h4>
          <ul className="mt-2">
            <Field name="date" type="string · opcjonalne">
              Dzień <code>YYYY-MM-DD</code>. Domyślnie dziś.
            </Field>
          </ul>
          <h4 className="mt-4 font-hand text-base font-semibold">Przykładowe wywołanie</h4>
          <Code>{`{ "date": "2026-06-07" }`}</Code>
          <h4 className="mt-4 font-hand text-base font-semibold">Wynik</h4>
          <Code>{`{
  "ok": true,
  "entry": {
    "date": "2026-06-07",
    "metrics": { "aktywnosc": 3, "apetyt": 1, "vocal": 2, "zabawa": 2 },
    "note": "<p>Dużo biegał ...</p>",
    "updated_at": "2026-06-07T18:55:46.159+00:00"
  }
}`}</Code>
        </div>
      </section>
    </div>
  );
}
