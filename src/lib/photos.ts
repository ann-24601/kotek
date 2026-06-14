/* =============================================================
   Kotek — zdjęcia dnia (Supabase Storage, prywatny bucket).
   Upload / usuwanie / podpisane URL-e do wyświetlania.
   Pliki trzymane pod ścieżką {userId}/{date}/{uuid}.{ext},
   gdzie pierwszy segment = auth.uid() (wymóg RLS na storage.objects).
   ============================================================= */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export const PHOTO_BUCKET = "day-photos";

/** Limit rozmiaru pliku (zgodny z file_size_limit bucketa). */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB

/** Akceptowane typy MIME (zgodne z allowed_mime_types bucketa). */
export const ACCEPTED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

/** Atrybut accept dla <input type="file">. */
export const PHOTO_ACCEPT = ACCEPTED_PHOTO_TYPES.join(",");

const SIGNED_URL_TTL = 60 * 60; // 1 h

function extFor(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop() : "";
  const ext = (fromName || file.type.split("/")[1] || "jpg").toLowerCase();
  // sanity: tylko bezpieczne znaki
  return ext.replace(/[^a-z0-9]/g, "") || "jpg";
}

/**
 * Wysyła zdjęcie do bucketa `day-photos` i zwraca jego ścieżkę (klucz).
 * Rzuca błędem przy złym typie / zbyt dużym pliku / błędzie uploadu.
 */
export async function uploadDayPhoto(
  userId: string,
  date: string,
  file: File,
): Promise<string> {
  if (file.type && !ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    throw new Error("Nieobsługiwany format pliku — wybierz zdjęcie.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Zdjęcie jest za duże (maks. 10 MB).");
  }

  const path = `${userId}/${date}/${crypto.randomUUID()}.${extFor(file)}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw error;

  return path;
}

/** Usuwa zdjęcie z bucketa. */
export async function removeDayPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  if (error) throw error;
}

/**
 * Generuje podpisane URL-e dla podanych ścieżek (batch). Zwraca mapę
 * ścieżka → URL. Odświeża się, gdy zmieni się zestaw ścieżek.
 */
export function useSignedUrls(paths: string[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  // stabilny klucz zależności (kolejność nieistotna)
  const key = [...paths].sort().join("|");

  useEffect(() => {
    let active = true;
    if (paths.length === 0) {
      setUrls({});
      return;
    }

    void supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL)
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        const next: Record<string, string> = {};
        for (const item of data) {
          if (item.path && item.signedUrl) next[item.path] = item.signedUrl;
        }
        setUrls(next);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return urls;
}
