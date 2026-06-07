"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { useCat } from "@/context/CatContext";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

/* Atrapa odpowiedzi — behawiorysta AI zostanie podłączony do API później
   (docelowo Next.js API route z kluczem w env). UI jest w pełni działające. */
function mockReply(): string {
  return `To podgląd rozmowy z behawiorystą. Wkrótce odpowie tu prawdziwy asystent AI — przeanalizuje Twój dziennik z zakładki „Dziś", profil zabawy i rytuał, a potem podpowie konkretne kroki.\n\nNa razie zapisuj obserwacje w zakładce „Dziś" — to z nich będzie korzystał.`;
}

export function Chat() {
  const { profile } = useCat();
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

  const send = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    window.setTimeout(() => {
      setMsgs((m) => [...m, { role: "assistant", content: mockReply() }]);
      setBusy(false);
    }, 600);
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
              "max-w-[88%] whitespace-pre-wrap px-3.5 py-3 text-base leading-normal",
              m.role === "user"
                ? "self-end rounded-[16px_16px_4px_16px] bg-ink text-paper"
                : "flex flex-col gap-1 self-start rounded-[16px_16px_16px_4px] border-2 border-ink bg-paper",
            )}
          >
            {m.role === "assistant" && (
              <span className="font-hand text-xs font-bold">behawiorysta</span>
            )}
            <span>{m.content}</span>
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
