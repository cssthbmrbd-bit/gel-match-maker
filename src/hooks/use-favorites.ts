import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "lgc:favorites:v1";

/** Build a stable key from a list of gel numbers (order-independent). */
export function favoriteKey(gelNumbers: string[]): string {
  return [...gelNumbers].sort().join("+");
}

function readStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed.filter((v) => typeof v === "string"));
    return new Set();
  } catch {
    return new Set();
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    setFavorites(readStorage());
  }, []);

  const persist = useCallback((next: Set<string>) => {
    setFavorites(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // ignore quota / privacy mode errors
    }
  }, []);

  const toggle = useCallback(
    (key: string) => {
      const next = new Set(favorites);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      persist(next);
    },
    [favorites, persist],
  );

  const isFavorite = useCallback((key: string) => favorites.has(key), [favorites]);

  return { favorites, toggle, isFavorite };
}
