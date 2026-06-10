const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Debounce localStorage writes to avoid blocking the main thread during rapid updates. */
export function debouncedSave(key: string, value: string, delayMs = 280) {
  if (typeof window === "undefined") return;
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      try {
        localStorage.setItem(key, value);
      } catch {
        // Quota or private mode — fail silently for MVP
      }
    }, delayMs)
  );
}

export function flushDebouncedSave(key: string) {
  const existing = timers.get(key);
  if (existing) {
    clearTimeout(existing);
    timers.delete(key);
  }
}
