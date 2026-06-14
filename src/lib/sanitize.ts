/* =============================================================
   Kotek — sanityzacja HTML notatek (ochrona przed XSS).
   Notatki to HTML z edytora TipTap, ale mogą też trafić przez
   API/MCP jako dowolny HTML. Przed wyrenderowaniem (dangerouslySetInnerHTML)
   przepuszczamy je przez DOMPurify, który usuwa <script>, atrybuty
   zdarzeń (on*), URL-e javascript: itp., zostawiając zwykłe formatowanie.
   ============================================================= */
"use client";

import DOMPurify from "dompurify";

/** Czyści HTML notatki z aktywnych treści. Bezpieczne do wstrzyknięcia w DOM. */
export function sanitizeNoteHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["style"],
  });
}
