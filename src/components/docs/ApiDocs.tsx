/* =============================================================
   Kotek — zakładka „API" dokumentacji.
   REST API v1: Create / Ask / Read. Przykłady curl podstawiają
   token z paska (token=puste → placeholder <TWÓJ_TOKEN>).
   ============================================================= */
import { Code, Field, Method } from "./primitives";

const BASE = "https://kotek-nu.vercel.app";

export default function ApiDocs({ token }: { token: string }) {
  const bearer = token || "<TWÓJ_TOKEN>";

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8 lg:px-8 lg:py-12">
      <h1 className="text-[2rem]">Kotek API</h1>
      <p className="mt-3 text-ink-soft">
        Proste API do sterowania dziennikiem kota i pytania behawiorysty AI. Trzy endpointy:
        zapis wpisu (<a className="underline" href="#create">Create</a>), pytanie do agenta
        (<a className="underline" href="#ask">Ask</a>) i odczyt wpisu
        (<a className="underline" href="#read">Read</a>). Odpowiedzi w formacie JSON.
      </p>

      {/* Podstawy */}
      <section className="mt-8">
        <h2 className="text-2xl">Podstawy</h2>
        <p className="mt-2 text-ink-soft">Bazowy adres:</p>
        <Code>{BASE}</Code>
        <p className="mt-2 text-ink-soft">
          Każdy endpoint działa <strong>per użytkownik</strong> i wymaga osobistego tokenu
          w nagłówku (wygeneruj go przyciskiem „Tokeny" u góry po zalogowaniu). Bez tokenu lub
          ze złym tokenem zwracane jest <code>401</code>.
        </p>
        <Code>{`Authorization: Bearer ${bearer}`}</Code>
        <p className="mt-2 text-ink-soft">
          Daty mają format <code>YYYY-MM-DD</code>. Gdy pominiesz <code>date</code>, przyjmowany
          jest <strong>dzisiejszy dzień</strong>.
        </p>
      </section>

      {/* CREATE */}
      <section id="create" className="mt-12 scroll-mt-6">
        <div className="flex items-center gap-3">
          <Method verb="POST" />
          <code className="text-[0.95rem] font-semibold">/api/v1/entries</code>
        </div>
        <h2 className="mt-3 text-2xl">Create — dodaj wpis</h2>
        <p className="mt-2 text-ink-soft">
          Tworzy lub aktualizuje (upsert) wpis dziennika na dany dzień. Domyślnie dziś.
        </p>

        <h3 className="mt-5 text-lg">Body (JSON)</h3>
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

        <h3 className="mt-5 text-lg">Przykład</h3>
        <Code>{`curl -X POST ${BASE}/api/v1/entries \\
  -H "Authorization: Bearer ${bearer}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "date": "2026-06-07",
    "metrics": { "aktywnosc": 3, "apetyt": 1, "vocal": 2, "zabawa": 2 },
    "note": "<p>Dużo biegał, jadł normalnie, świetna sesja zabawy.</p>"
  }'`}</Code>

        <h3 className="mt-5 text-lg">Odpowiedź</h3>
        <Code>{`{
  "ok": true,
  "entry": {
    "date": "2026-06-07",
    "metrics": { "aktywnosc": 3, "apetyt": 1, "vocal": 2, "zabawa": 2 },
    "note": "<p>Dużo biegał, jadł normalnie, świetna sesja zabawy.</p>",
    "updated_at": "2026-06-07T18:55:46.159+00:00"
  }
}`}</Code>
      </section>

      {/* ASK */}
      <section id="ask" className="mt-12 scroll-mt-6">
        <div className="flex items-center gap-3">
          <Method verb="POST" />
          <code className="text-[0.95rem] font-semibold">/api/v1/ask</code>
        </div>
        <h2 className="mt-3 text-2xl">Ask — zapytaj behawiorystę</h2>
        <p className="mt-2 text-ink-soft">
          Zadaje pytanie agentowi AI. Kontekstem jest pełny profil kota i wszystkie wpisy, z
          wyróżnieniem wskazanego dnia. <strong>Historia rozmowy jest pamiętana per dzień</strong> —
          kolejne pytania z tym samym <code>date</code> kontynuują wątek.
        </p>

        <h3 className="mt-5 text-lg">Body (JSON)</h3>
        <ul className="mt-2">
          <Field name="question" type="string · wymagane">
            Treść pytania do behawiorysty.
          </Field>
          <Field name="date" type="string · opcjonalne">
            Dzień jako kontekst i wątek rozmowy. Domyślnie dziś.
          </Field>
        </ul>

        <h3 className="mt-5 text-lg">Przykład</h3>
        <Code>{`curl -X POST ${BASE}/api/v1/ask \\
  -H "Authorization: Bearer ${bearer}" \\
  -H "Content-Type: application/json" \\
  -d '{ "question": "Jak oceniasz ten dzień i co poprawić?", "date": "2026-06-07" }'`}</Code>

        <h3 className="mt-5 text-lg">Odpowiedź</h3>
        <Code>{`{
  "ok": true,
  "date": "2026-06-07",
  "answer": "### Ocena dnia ...",
  "messages": [
    { "role": "user", "content": "Jak oceniasz ten dzień i co poprawić?" },
    { "role": "assistant", "content": "### Ocena dnia ..." }
  ]
}`}</Code>
      </section>

      {/* READ */}
      <section id="read" className="mt-12 scroll-mt-6">
        <div className="flex items-center gap-3">
          <Method verb="GET" />
          <code className="text-[0.95rem] font-semibold">/api/v1/entries</code>
        </div>
        <h2 className="mt-3 text-2xl">Read — odczytaj wpis</h2>
        <p className="mt-2 text-ink-soft">
          Zwraca wpis dziennika na dany dzień. Domyślnie dziś. Gdy wpisu nie ma —{" "}
          <code>entry</code> jest <code>null</code>.
        </p>

        <h3 className="mt-5 text-lg">Parametry (query)</h3>
        <ul className="mt-2">
          <Field name="date" type="string · opcjonalne">
            Dzień <code>YYYY-MM-DD</code>. Domyślnie dziś.
          </Field>
        </ul>

        <h3 className="mt-5 text-lg">Przykład</h3>
        <Code>{`curl ${BASE}/api/v1/entries?date=2026-06-07 \\
  -H "Authorization: Bearer ${bearer}"`}</Code>

        <h3 className="mt-5 text-lg">Odpowiedź</h3>
        <Code>{`{
  "ok": true,
  "entry": {
    "date": "2026-06-07",
    "metrics": { "aktywnosc": 3, "apetyt": 1, "vocal": 2, "zabawa": 2 },
    "note": "<p>Dużo biegał ...</p>",
    "updated_at": "2026-06-07T18:55:46.159+00:00"
  }
}`}</Code>
      </section>
    </div>
  );
}
