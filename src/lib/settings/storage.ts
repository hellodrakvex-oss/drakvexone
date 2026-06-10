import { debouncedSave } from "@/lib/storage/debounced-save";
import { DEFAULT_SETTINGS, type AppSettings } from "./types";

const STORAGE_KEY = "drakvex-settings-v1";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  debouncedSave(STORAGE_KEY, JSON.stringify(settings));
}

export function saveSettingsImmediate(settings: AppSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
