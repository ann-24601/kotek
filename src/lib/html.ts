/* =============================================================
   Kotek — pomocnicze operacje na HTML.
   Notatki dziennika to HTML (TipTap); do embeddingów, FTS oraz
   serializacji kontekstu behawiorysty potrzebny czysty tekst.
   ============================================================= */

/** Zamienia HTML notatki na czysty tekst (usuwa tagi, &nbsp;, zbędne spacje). */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
