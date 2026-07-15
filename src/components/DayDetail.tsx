"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { RoughBorder } from "@/components/RoughBorder";
import { Squiggle } from "@/components/Squiggle";
import { PhotoThumbs } from "@/components/PhotoUploader";
import { METRICS } from "@/lib/constants";
import { fmtLong } from "@/lib/dates";
import { sanitizeNoteHtml } from "@/lib/sanitize";
import { useCat } from "@/context/CatContext";
import type { DayLog } from "@/lib/types";

/** notatki są HTML (TipTap) — do listy pokazujemy czysty tekst */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** etykieta opcji metryki dla danej wartości */
export function optLabel(key: keyof DayLog["m"], v: number | undefined): string {
  if (v == null) return "—";
  const mt = METRICS.find((x) => x.key === key);
  return mt?.options.find((o) => o.v === v)?.l ?? "—";
}

/** modal ze szczegółami pojedynczego dnia (wpis dziennika) */
export function DayDetail({ log, onClose }: { log: DayLog; onClose: () => void }) {
  const router = useRouter();
  const { deleteLog } = useCat();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hasNote = Boolean(log.note && stripHtml(log.note).length > 0);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Wpis — ${fmtLong(log.date)}`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] rounded-[16px] bg-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <RoughBorder radius={16} />
        <div className="scroll-sketch max-h-[85vh] overflow-y-auto p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg first-letter:uppercase">{fmtLong(log.date)}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Zamknij" className="-mr-1 shrink-0 p-1">
            <Icon name="close" size={22} />
          </Button>
        </div>

        {log.photos && log.photos.length > 0 && (
          <div className="mb-4">
            <PhotoThumbs photos={log.photos} full />
          </div>
        )}

        {hasNote ? (
          <div
            className="tiptap mb-4 text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(log.note!) }}
          />
        ) : (
          <p className="mb-4 text-sm text-ink-soft">Brak treści notatki tego dnia.</p>
        )}

        <Squiggle className="mb-3" />
        <div className="flex flex-col gap-2">
          {METRICS.map((mt) => (
            <div key={mt.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-ink-soft">
                <Icon name={mt.icon} size={16} />
                {mt.label}
              </span>
              <span className="font-mono font-medium">{optLabel(mt.key, log.m?.[mt.key])}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2.5">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => router.push(`/dodaj-wpis?date=${log.date}`)}
          >
            <Icon name="edit" size={18} />
            Edytuj
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(true)}>
            <Icon name="close" size={18} />
            Usuń wpis
          </Button>
        </div>
        </div>

        {confirmDelete && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-[16px] bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setConfirmDelete(false)}
          >
            <div
              className="ink-edge ink-edge--soft w-full max-w-[320px] rounded-[var(--r-box-2)] bg-paper p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-hand text-lg font-semibold">Usunąć wpis z tego dnia?</p>
              <p className="mt-1 text-sm text-ink-faint">Notatka i metryki znikną z dziennika. Tej operacji nie można cofnąć.</p>
              <div className="mt-4 flex gap-2.5">
                <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>
                  Zostaw
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    deleteLog(log.date);
                    onClose();
                  }}
                >
                  Usuń
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
