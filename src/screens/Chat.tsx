"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/Markdown";
import { useCat } from "@/context/CatContext";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Chat() {
  const { profile, playProfile, pillars, logs } = useCat();
  const name = profile?.name ?? "kota";

  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  const suggestions = [
    `${name}: jak go dziś wybawić?`,
    `${name} miauczy o jedzenie — jak to przerwać?`,
    "Co mówią dane z ostatnich dni?",
    "Czy dobrze urządziłem mu środowisko?",
  ];

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    const nextMsgs: ChatMessage[] = [...msgs, { role: "user", content: q }];
    setMsgs(nextMsgs);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMsgs,
          context: { profile, playProfile, pillars, logs },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Błąd serwera");
      setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Przepraszam, coś poszło nie tak po mojej stronie. Spróbuj ponownie za chwilę.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col pt-2">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4" role="log" aria-live="polite">
        {msgs.length === 0 && (
          <div>
            <h2 className="mb-1 text-xl">Z czym mogę pomóc?</h2>
            <p className="mb-3 text-sm text-ink-soft">
              Pytaj o zabawę, rytuał albo nietypowe zachowania Twojego kota.
            </p>
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="flex min-h-11 items-center gap-2 rounded-[var(--r-chip)] border border-[#c9c9c4] bg-paper px-3.5 py-2.5 text-left text-sm text-ink"
                  onClick={() => send(s)}
                >
                  <Icon name="arrowRight" size={16} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[88%] px-3.5 py-3 text-base leading-normal",
              m.role === "user"
                ? "self-end whitespace-pre-wrap rounded-[16px_16px_4px_16px] bg-ink text-paper"
                : "flex flex-col gap-1 self-start rounded-[16px_16px_16px_4px] border-2 border-ink bg-paper",
            )}
          >
            {m.role === "user" ? (
              <span>{m.content}</span>
            ) : (
              <>
                <span className="font-hand text-xs font-bold">behawiorysta</span>
                <Markdown>{m.content}</Markdown>
              </>
            )}
          </div>
        ))}

        {busy && (
          <div className="max-w-[88%] self-start rounded-[16px_16px_16px_4px] border-2 border-ink bg-paper px-3.5 py-3">
            <span className="italic text-ink-faint">analizuję…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 flex gap-2 bg-paper py-3">
        <input
          className="min-h-11 flex-1 rounded-[var(--r-box)] border-2 border-ink bg-paper px-3.5 py-3 text-base text-ink placeholder:text-ink-faint"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Napisz wiadomość…"
          aria-label="Treść wiadomości"
        />
        <button
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-box)] border-2 border-ink bg-ink text-paper disabled:opacity-40"
          onClick={() => send()}
          disabled={busy || !input.trim()}
          aria-label="Wyślij wiadomość"
        >
          <Icon name="send" size={20} />
        </button>
      </div>
    </div>
  );
}
