import { useCallback, useEffect, useState } from "react";
import type { CategoryId } from "../types";

const KEY = "browse.ui.v1";
const LEGACY_KEY = "everyone.ui.v1";

export interface AppMemory {
  category: CategoryId;
  sidebarOpen: boolean;
}

const DEFAULTS: AppMemory = {
  category: "all",
  sidebarOpen: true,
};

function load(): AppMemory {
  try {
    const raw =
      localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<AppMemory>;
    return {
      category: (p.category as CategoryId) ?? DEFAULTS.category,
      sidebarOpen: p.sidebarOpen ?? DEFAULTS.sidebarOpen,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Persist lightweight UI session (category, sidebar) across restarts. */
export function useAppMemory() {
  const [memory, setMemoryState] = useState<AppMemory>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(memory));
    } catch {
      /* quota / private mode */
    }
  }, [memory]);

  const setMemory = useCallback((patch: Partial<AppMemory>) => {
    setMemoryState((m) => ({ ...m, ...patch }));
  }, []);

  return { memory, setMemory };
}
