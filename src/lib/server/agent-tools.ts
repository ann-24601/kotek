/* =============================================================
   Kotek — narzędzia behawiorysty AI (OpenAI Agents SDK).
   search_diary: wyszukiwanie hybrydowe po wpisach dziennika,
   żeby agent sięgał do trafnych wpisów zamiast całej historii.
   Reużywa hybridSearch z lib/server/search.ts. App jednouż. —
   właściciel z KOTEK_USER_ID (jak MCP/API v1).
   ============================================================= */
import { tool } from "@openai/agents";
import { z } from "zod";
import { adminClient, envOrThrow } from "./admin";
import { hybridSearch, type MetricFilters } from "./search";

const METRIC_FILTER = z
  .object({
    min: z.number().int().nullish(),
    max: z.number().int().nullish(),
  })
  .nullish();

/** Narzędzie wyszukiwania dziennika dla agenta-behawiorysty. */
export const searchDiaryTool = tool({
  name: "search_diary",
  description:
    "Przeszukaj dziennik kota i znajdź najtrafniejsze wpisy do pytania właściciela " +
    "(hybrydowo: znaczenie + słowa kluczowe). Używaj, gdy potrzebujesz konkretnych " +
    "obserwacji z przeszłości (np. epizody, objawy, reakcje na zabawę). " +
    "Opcjonalnie zawęź po metrykach (min/max): aktywnosc 0–3, apetyt 0–2, vocal 0–5, zabawa 0–2.",
  parameters: z.object({
    query: z.string().describe("Czego szukać, np. 'wymioty po jedzeniu'."),
    filters: z
      .object({
        aktywnosc: METRIC_FILTER,
        apetyt: METRIC_FILTER,
        vocal: METRIC_FILTER,
        zabawa: METRIC_FILTER,
      })
      .nullish()
      .describe("Opcjonalne filtry po metrykach (min/max, włącznie)."),
    limit: z.number().int().min(1).max(50).nullish().describe("Maks. wyników (domyślnie 30)."),
  }),
  async execute({ query, filters, limit }) {
    const hits = await hybridSearch(adminClient(), envOrThrow("KOTEK_USER_ID"), {
      query,
      filters: (filters ?? undefined) as MetricFilters | undefined,
      limit: limit ?? undefined,
    });
    // Zwięźle dla modelu: data + metryki + notatka.
    return JSON.stringify(
      hits.map((h) => ({ date: h.date, metrics: h.metrics, note: h.note })),
    );
  },
});
