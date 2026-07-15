"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Art } from "@/components/Illustration";
import { RoughBorder } from "@/components/RoughBorder";
import { AgentToggle } from "@/components/AgentToggle";
import { Markdown } from "@/components/Markdown";
import { useAuth } from "@/context/AuthContext";
import { useAgents } from "@/context/AgentsContext";
import { useCat } from "@/context/CatContext";
import { getAgent } from "@/lib/agents/registry";
import { genitiveCatName } from "@/lib/polish";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

/* rozmowa przeżywa nawigację między zakładkami (w ramach karty przeglądarki) */
const CHAT_STORAGE_KEY = "kotek-chat";

function loadStoredMsgs(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(CHAT_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function Chat() {
  const { profile, playProfile, pillars, logs } = useCat();
  const { session } = useAuth();
  const { selectedAgentId } = useAgents();
  const agent = getAgent(selectedAgentId);
  const name = profile?.name ?? "kot";

  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // wczytanie po montażu (nie w inicjalizatorze stanu) — SSR nie zna sessionStorage
  useEffect(() => {
    const stored = loadStoredMsgs();
    if (stored.length > 0) setMsgs(stored);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs));
    } catch {
      /* pełny storage nie może blokować rozmowy */
    }
  }, [msgs]);

  const suggestions = [
    `Jak wybawić dzisiaj ${genitiveCatName(name)}?`,
    "Jak przerwać miauczenie o jedzenie?",
    "Co mówią dane z ostatnich dni?",
    "Dobrze urządzone środowisko",
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
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          messages: nextMsgs,
          context: { profile, playProfile, pillars, logs },
          agentId: selectedAgentId,
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

  const newChat = () => {
    setMsgs([]);
    try {
      window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex min-h-full flex-col pt-1">
      <div className="relative mb-3 flex items-center justify-center">
        <AgentToggle />
        {msgs.length > 0 && (
          <button
            type="button"
            onClick={newChat}
            className="absolute right-0 inline-flex min-h-9 items-center gap-1.5 font-hand text-sm font-semibold text-ink-soft hover:text-ink"
            aria-label="Zacznij nową rozmowę"
          >
            <Icon name="plus" size={16} />
            <span className="hidden sm:inline">Nowa rozmowa</span>
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4" role="log" aria-live="polite">
        {msgs.length === 0 && (
          <div>
            <div className="mb-4 flex justify-center" aria-hidden="true">
              <Art name="lenistwo" size={260} className="max-w-full" />
            </div>
            <h2 className="mb-1.5 text-center text-2xl">Z czym mogę pomóc?</h2>
            <p className="mx-auto mb-6 max-w-[19rem] text-center text-sm text-ink-soft">
              Możesz zapytać o zabawę, rytuały lub nietypowe zachowania Twojego kota.
            </p>
            <div className="flex flex-col gap-2.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="flex min-h-11 items-center gap-2.5 rounded-[13px] bg-ink px-4 py-2.5 text-left text-sm font-bold text-paper transition-transform active:translate-x-[1px] active:translate-y-[1px]"
                  onClick={() => send(s)}
                >
                  <Icon name="arrowRight" size={16} className="shrink-0" />
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
                <span className="flex items-center gap-1.5 font-hand text-xs font-bold">
                  <Icon name={agent?.icon ?? "cat"} size={18} />
                  {agent?.name ?? "behawiorysta"}
                </span>
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
        <div className="relative flex-1 rounded-[14px] bg-paper focus-within:outline focus-within:outline-[2.5px] focus-within:outline-dashed focus-within:outline-ink focus-within:outline-offset-[3px]">
          <RoughBorder radius={14} wavelength={22} amplitude={2.2} />
          <textarea
            className="block max-h-40 min-h-11 w-full resize-none rounded-[var(--r-box)] bg-transparent px-3.5 py-3 text-base leading-snug text-ink placeholder:text-ink-faint focus:outline-none"
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // auto-rozrost do treści (do max-h)
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
                (e.target as HTMLTextAreaElement).style.height = "auto";
              }
            }}
            placeholder="Napisz wiadomość…"
            aria-label="Treść wiadomości"
          />
        </div>
        <button
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-ink text-paper disabled:opacity-40"
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
