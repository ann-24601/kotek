"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatProfile, DayLog, Pillars, PlayProfile } from "../lib/types";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

interface CatState {
  loaded: boolean;
  profile: CatProfile | null;
  pillars: Pillars;
  playProfile: PlayProfile | null;
  logs: DayLog[];
  saveProfile: (p: CatProfile) => void;
  savePillars: (p: Pillars) => void;
  savePlayProfile: (p: PlayProfile) => void;
  saveLogs: (l: DayLog[]) => void;
  resetAll: () => void;
}

const Ctx = createContext<CatState | null>(null);

/* --- mapowanie wierszy day_logs <-> DayLog --- */
interface DayLogRow {
  date: string;
  metrics: DayLog["m"];
  note: string | null;
  photos: string[] | null;
}

function rowToLog(r: DayLogRow): DayLog {
  return {
    date: r.date,
    m: r.metrics ?? {},
    note: r.note ?? undefined,
    photos: r.photos ?? [],
  };
}

export function CatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<CatProfile | null>(null);
  const [pillars, setPillars] = useState<Pillars>({});
  const [playProfile, setPlayProfile] = useState<PlayProfile | null>(null);
  const [logs, setLogs] = useState<DayLog[]>([]);

  // Wczytanie danych użytkownika z Supabase po zalogowaniu; reset po wylogowaniu.
  useEffect(() => {
    let active = true;

    if (!userId) {
      setProfile(null);
      setPillars({});
      setPlayProfile(null);
      setLogs([]);
      setLoaded(false);
      return;
    }

    setLoaded(false);
    (async () => {
      const [{ data: prof }, { data: rows }] = await Promise.all([
        supabase
          .from("cat_profiles")
          .select("profile, play_profile, pillars")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("day_logs")
          .select("date, metrics, note, photos")
          .eq("user_id", userId)
          .order("date", { ascending: true }),
      ]);

      if (!active) return;
      setProfile((prof?.profile as CatProfile) ?? null);
      setPlayProfile((prof?.play_profile as PlayProfile) ?? null);
      setPillars((prof?.pillars as Pillars) ?? {});
      setLogs(((rows as DayLogRow[] | null) ?? []).map(rowToLog));
      setLoaded(true);
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<CatState>(() => {
    // Upsert dotykający TYLKO jednej kolumny cat_profiles. Dzięki temu kilka zapisów
    // pod rząd (np. saveProfile + savePlayProfile w onboardingu) nie kasuje się nawzajem
    // — każdy aktualizuje swoje pole, a ON CONFLICT zostawia pozostałe kolumny bez zmian.
    const upsertColumn = (column: "profile" | "play_profile" | "pillars", val: unknown) => {
      if (!userId) return;
      void supabase
        .from("cat_profiles")
        .upsert(
          { user_id: userId, [column]: val, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        )
        .then(({ error }) => {
          if (error) console.error("Zapis profilu nie powiódł się:", error.message);
        });
    };

    return {
      loaded,
      profile,
      pillars,
      playProfile,
      logs,
      saveProfile: (p) => {
        setProfile(p);
        upsertColumn("profile", p);
      },
      savePillars: (p) => {
        setPillars(p);
        upsertColumn("pillars", p);
      },
      savePlayProfile: (p) => {
        setPlayProfile(p);
        upsertColumn("play_profile", p);
      },
      saveLogs: (l) => {
        setLogs(l);
        if (!userId) return;

        // Zapis nieniszczący: tylko upsert przekazanych dni. NIE kasujemy dni spoza
        // tablicy — wcześniej tak robiliśmy ("zapis różnicowy"), ale wywołania z
        // częściową listą (loader demo) usuwały wtedy całą resztę historii. Pełne
        // czyszczenie dziennika jest dostępne osobno przez resetAll (z potwierdzeniem).
        const now = new Date().toISOString();

        void supabase
          .from("day_logs")
          .upsert(
            l.map((x) => ({
              user_id: userId,
              date: x.date,
              metrics: x.m,
              note: x.note ?? null,
              photos: x.photos ?? [],
              updated_at: now,
            })),
            { onConflict: "user_id,date" },
          )
          .then(({ error }) => {
            if (error) console.error("Zapis wpisów nie powiódł się:", error.message);
          });
      },
      resetAll: () => {
        setProfile(null);
        setPillars({});
        setPlayProfile(null);
        setLogs([]);
        if (!userId) return;
        void supabase.from("day_logs").delete().eq("user_id", userId);
        void supabase.from("cat_profiles").delete().eq("user_id", userId);
      },
    };
  }, [loaded, profile, pillars, playProfile, logs, userId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCat(): CatState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCat musi być użyte wewnątrz <CatProvider>");
  return ctx;
}
