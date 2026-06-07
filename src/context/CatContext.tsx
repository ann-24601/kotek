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
import { storage, KEYS } from "../lib/storage";

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

export function CatProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<CatProfile | null>(null);
  const [pillars, setPillars] = useState<Pillars>({});
  const [playProfile, setPlayProfile] = useState<PlayProfile | null>(null);
  const [logs, setLogs] = useState<DayLog[]>([]);

  useEffect(() => {
    setProfile(storage.get<CatProfile>(KEYS.profile));
    setPillars(storage.get<Pillars>(KEYS.pillars) || {});
    setPlayProfile(storage.get<PlayProfile>(KEYS.playProfile));
    setLogs(storage.get<DayLog[]>(KEYS.logs) || []);
    setLoaded(true);
  }, []);

  const value = useMemo<CatState>(
    () => ({
      loaded,
      profile,
      pillars,
      playProfile,
      logs,
      saveProfile: (p) => {
        setProfile(p);
        storage.set(KEYS.profile, p);
      },
      savePillars: (p) => {
        setPillars(p);
        storage.set(KEYS.pillars, p);
      },
      savePlayProfile: (p) => {
        setPlayProfile(p);
        storage.set(KEYS.playProfile, p);
      },
      saveLogs: (l) => {
        setLogs(l);
        storage.set(KEYS.logs, l);
      },
      resetAll: () => {
        setProfile(null);
        setPillars({});
        setPlayProfile(null);
        setLogs([]);
        storage.remove(KEYS.profile);
        storage.remove(KEYS.pillars);
        storage.remove(KEYS.playProfile);
        storage.remove(KEYS.logs);
      },
    }),
    [loaded, profile, pillars, playProfile, logs],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCat(): CatState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCat musi być użyte wewnątrz <CatProvider>");
  return ctx;
}
