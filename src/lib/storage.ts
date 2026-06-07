/* =============================================================
   Kotek — warstwa zapisu (localStorage + fallback do pamięci)
   ============================================================= */

const mem: Record<string, unknown> = {};

const PREFIX = "kotek:";

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      /* tryb prywatny / brak dostępu — fallback poniżej */
    }
    return (mem[key] as T) ?? null;
  },

  set<T>(key: string, value: T): void {
    mem[key] = value;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* ignorujemy — dane zostają w pamięci sesji */
    }
  },

  remove(key: string): void {
    delete mem[key];
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};

/* klucze modelu danych (PRD 9) */
export const KEYS = {
  profile: "profile",
  pillars: "pillars",
  playProfile: "playProfile",
  logs: "logs",
} as const;
