"use client";

import ReactMarkdown from "react-markdown";

/* Renderuje odpowiedzi behawiorysty (Markdown) w stylu „rysowane długopisem":
   czytelne odstępy, pogrubienia, listy i krótkie nagłówki. */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="my-2 first:mt-0 last:mb-0 leading-relaxed">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-bold text-ink">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => (
          <h3 className="mb-1 mt-3 font-hand text-lg first:mt-0">{children}</h3>
        ),
        h2: ({ children }) => (
          <h3 className="mb-1 mt-3 font-hand text-lg first:mt-0">{children}</h3>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 mt-3 font-hand text-base first:mt-0">{children}</h3>
        ),
        code: ({ children }) => (
          <code className="rounded bg-paper-2 px-1 py-0.5 text-sm">{children}</code>
        ),
        a: ({ children, href }) => (
          <a href={href} className="underline" target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
