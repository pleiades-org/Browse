import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, type AppSettings } from "../types";

const KEY = "everyone.settings.v2";

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      maxConcurrent: parsed.maxConcurrent ?? DEFAULT_SETTINGS.maxConcurrent,
      compactMode: parsed.compactMode ?? DEFAULT_SETTINGS.compactMode,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const setSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettingsState((s) => ({ ...s, ...patch }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState({ ...DEFAULT_SETTINGS });
  }, []);

  return { settings, setSettings, resetSettings };
}
