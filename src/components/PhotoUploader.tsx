"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  PHOTO_ACCEPT,
  removeDayPhoto,
  uploadDayPhoto,
  useSignedUrls,
} from "@/lib/photos";

/* =============================================================
   Miniatury zdjęć dnia.
   - `onRemove` → tryb edycji (małe kafelki z przyciskiem ×).
   - `full` → podgląd na pełną szerokość, naturalna wysokość
     (np. w historii w Statystykach; popup dopasowuje wysokość).
   ============================================================= */
export function PhotoThumbs({
  photos,
  onRemove,
  full = false,
}: {
  photos: string[];
  onRemove?: (path: string) => void;
  full?: boolean;
}) {
  const urls = useSignedUrls(photos);
  if (photos.length === 0) return null;

  if (full) {
    return (
      <div className="flex flex-col gap-3">
        {photos.map((path) =>
          urls[path] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={path}
              src={urls[path]}
              alt="Zdjęcie dnia"
              className="h-auto w-full rounded-[var(--r-box)] border-2 border-ink"
            />
          ) : (
            <div
              key={path}
              className="aspect-[4/3] w-full animate-pulse rounded-[var(--r-box)] border-2 border-ink bg-hairline/40"
            />
          ),
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((path) => (
        <div
          key={path}
          className="relative h-24 w-24 overflow-hidden rounded-[var(--r-box)] border-2 border-ink bg-paper"
        >
          {urls[path] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urls[path]}
              alt="Zdjęcie dnia"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-hairline/40" />
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(path)}
              aria-label="Usuń zdjęcie"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink shadow-[1px_1px_0_var(--ink)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Icon name="close" size={14} strokeWidth={2.4} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* =============================================================
   Przycisk „+" do dodawania zdjęć (ukryty input plików).
   Po wgraniu zwraca ścieżki przez onAdd.
   ============================================================= */
export function PhotoUploader({
  userId,
  date,
  onAdd,
}: {
  userId: string;
  date: string;
  onAdd: (paths: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => {
    setError(null);
    inputRef.current?.click();
  };

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // pozwala wybrać ten sam plik ponownie
    if (files.length === 0) return;

    setBusy(true);
    setError(null);
    const added: string[] = [];
    try {
      for (const file of files) {
        added.push(await uploadDayPhoto(userId, date, file));
      }
    } catch (err) {
      // wgrane do tej pory zostają; sprzątamy tylko bieżącą porażkę
      setError(err instanceof Error ? err.message : "Nie udało się wgrać zdjęcia.");
    } finally {
      if (added.length > 0) onAdd(added);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        multiple
        className="hidden"
        onChange={onFiles}
      />
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        className="flex items-center gap-2 self-start rounded-[var(--r-box)] border-2 border-dashed border-ink px-3.5 py-2 font-hand font-semibold text-ink transition-transform active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40"
      >
        <Icon name="plus" size={20} strokeWidth={2.2} />
        {busy ? "Wgrywanie…" : "Dodaj zdjęcie"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
