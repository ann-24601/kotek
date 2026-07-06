/**
 * Best-effort odmiana imion kotów przez dopełniacz (np. "u kogo?" → "u Mańka").
 * Pokrywa najczęstsze wzorce zdrobnień, nie jest pełnym silnikiem fleksji —
 * dla nietypowych imion po prostu zwraca formę niezmienioną.
 */
export function genitiveCatName(name: string): string {
  if (!name) return name;

  // Maniek -> Mańka (ruchome "e", zmiękczenie "ni" -> "ń")
  if (/niek$/i.test(name)) {
    return name.slice(0, -4) + "ńka";
  }
  // Burek -> Burka, Fistaszek -> Fistaszka (ruchome "e")
  if (/ek$/i.test(name)) {
    return name.slice(0, -2) + "ka";
  }
  // Fistaszko -> Fistaszka
  if (/o$/i.test(name)) {
    return name.slice(0, -1) + "a";
  }
  // Kasia -> Kasi, Mruczka -> Mruczki
  if (/a$/i.test(name)) {
    const soft = /(ci|si|zi|dzi|[źćńś])a$/i.test(name);
    return name.slice(0, -1) + (soft ? "i" : "y");
  }
  // Tygrys -> Tygrysa, Filemon -> Filemona
  if (/[bcćdfghjklłmnńprsśtwzźż]$/i.test(name)) {
    return name + "a";
  }
  return name;
}
