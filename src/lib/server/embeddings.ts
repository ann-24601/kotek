/* =============================================================
   Kotek — generowanie embeddingów (OpenAI).
   Model text-embedding-3-small @ 1536 wymiarów (zgodnie z kolumną
   day_logs.embedding vector(1536)). Wywołanie przez REST/fetch,
   bez dodatkowej zależności (w repo jest tylko @openai/agents).
   Klucz OPENAI_API_KEY pozostaje wyłącznie po stronie serwera.
   ============================================================= */

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIM = 1536;

/** Zwraca embedding tekstu (1536 liczb). Rzuca przy braku klucza / błędzie API. */
export async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Brak OPENAI_API_KEY na serwerze.");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIM,
      input: text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI embeddings ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as { data?: { embedding?: number[] }[] };
  const vector = data.data?.[0]?.embedding;
  if (!vector || vector.length !== EMBEDDING_DIM) {
    throw new Error("OpenAI embeddings: nieprawidłowa odpowiedź.");
  }
  return vector;
}

/** Format pgvector ('[a,b,c]') do przekazania jako text do RPC/kolumny. */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}
