// Persistent gel inventory for "Inventory Mode".
//
// Stores the user's owned gel numbers and the on/off mode toggle in
// localStorage so selections survive across sessions.

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "lgc.inventory.v1";
const MODE_KEY = "lgc.inventoryMode.v1";

// A small, opinionated set of commonly-stocked Lee filters used by the
// "Select common gels" quick action. These IDs exist in src/lib/gels.ts.
export const COMMON_GELS = [
  "026", // Bright Red
  "106", // Primary Red
  "126", // Mauve
  "138", // Pale Green
  "139", // Primary Green
  "158", // Deep Orange
  "164", // Flame Red
  "180", // Dark Lavender
  "201", // Full CT Blue
  "202", // Half CT Blue
  "204", // Full CT Orange
  "205", // Half CT Orange
  "010", // Medium Yellow
  "079", // Just Blue
  "120", // Deep Blue
  "132", // Medium Blue
  "144", // No Color Blue
  "147", // Apricot
  "152", // Pale Gold
  "151", // Gold Tint
];

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function readMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useInventory() {
  const [inventory, setInventoryState] = useState<Set<string>>(() => readSet());
  const [mode, setModeState] = useState<boolean>(() => readMode());

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(inventory)),
      );
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [inventory]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_KEY, mode ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [mode]);

  const setInventory = useCallback((next: Set<string>) => {
    setInventoryState(new Set(next));
  }, []);

  const toggle = useCallback((number: string) => {
    setInventoryState((prev) => {
      const next = new Set(prev);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  }, []);

  const clear = useCallback(() => setInventoryState(new Set()), []);

  const addMany = useCallback((numbers: string[]) => {
    setInventoryState((prev) => {
      const next = new Set(prev);
      for (const n of numbers) next.add(n);
      return next;
    });
  }, []);

  return {
    inventory,
    setInventory,
    toggle,
    clear,
    addMany,
    mode,
    setMode: setModeState,
  };
}
