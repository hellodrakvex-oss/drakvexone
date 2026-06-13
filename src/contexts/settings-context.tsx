"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type Language,
} from "@/lib/settings/types";
import { fetchSettingsFromSupabase, saveSettingsToSupabase } from "@/lib/supabase/settings";
import { useAuth } from "./auth-context";

type SettingsContextValue = {
  settings: AppSettings;
  isHydrated: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setLanguage: (language: Language) => void;
  setNotifications: (enabled: boolean) => void;
  setDueReminders: (enabled: boolean) => void;
  setDailySummary: (enabled: boolean) => void;
  saveSettings: () => Promise<{ success: boolean; error?: string }>;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

let globalSettingsCache: AppSettings | null = null;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(globalSettingsCache || DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(!!globalSettingsCache);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<AppSettings>(globalSettingsCache || DEFAULT_SETTINGS);

  // Load settings from Supabase on mount
  useEffect(() => {
    async function loadSettingsFromDB() {
      if (!user?.id) {
        setIsHydrated(true);
        return;
      }

      try {
        if (globalSettingsCache) {
          setSettings(globalSettingsCache);
          setOriginalSettings(globalSettingsCache);
          setIsHydrated(true);
        }

        const fetched = await fetchSettingsFromSupabase(user.id);
        if (fetched) {
          globalSettingsCache = fetched;
          setSettings(fetched);
          setOriginalSettings(fetched);
        }
      } catch (error) {
        console.error("[SettingsContext] Error loading settings:", error);
      } finally {
        setIsHydrated(true);
      }
    }

    loadSettingsFromDB();
  }, [user?.id]);

  // Update dirty state when settings change
  useEffect(() => {
    if (isHydrated) {
      const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasUnsavedChanges(isDirty);
    }
  }, [settings, originalSettings, isHydrated]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      return next;
    });
  }, []);

  const setLanguage = useCallback((language: Language) => {
    updateSettings({ language });
  }, [updateSettings]);

  const setNotifications = useCallback((enabled: boolean) => {
    updateSettings({ pushNotifications: enabled });
  }, [updateSettings]);

  const setDueReminders = useCallback((enabled: boolean) => {
    updateSettings({ dueReminders: enabled });
  }, [updateSettings]);

  const setDailySummary = useCallback((enabled: boolean) => {
    updateSettings({ dailySummary: enabled });
  }, [updateSettings]);

  const saveSettings = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: "User not authenticated" };
    }

    setIsSaving(true);
    try {
      const result = await saveSettingsToSupabase(user.id, settings);
      if (result.success) {
        globalSettingsCache = settings;
        setOriginalSettings(settings);
        setHasUnsavedChanges(false);
      }
      return result;
    } catch (error) {
      console.error("[SettingsContext] Save error:", error);
      return { success: false, error: String(error) };
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, settings]);

  const value = useMemo(
    () => ({
      settings,
      isHydrated,
      hasUnsavedChanges,
      isSaving,
      updateSettings,
      setLanguage,
      setNotifications,
      setDueReminders,
      setDailySummary,
      saveSettings,
    }),
    [
      settings,
      isHydrated,
      hasUnsavedChanges,
      isSaving,
      updateSettings,
      setLanguage,
      setNotifications,
      setDueReminders,
      setDailySummary,
      saveSettings,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
