import { debouncedSave } from "@/lib/storage/debounced-save";
import type { CustomerDue } from "./types";

const STORAGE_KEY = "drakvex-due-v1";

/**
 * Sanitize dues by removing duplicates
 * Keeps only the most recent version of each due ID
 */
function sanitizeDues(dues: CustomerDue[]): CustomerDue[] {
  if (!Array.isArray(dues) || dues.length === 0) return dues;

  const seen = new Map<string, CustomerDue>();
  
  // Process in reverse order so earlier entries override later ones (most recent wins)
  for (let i = dues.length - 1; i >= 0; i--) {
    const due = dues[i];
    if (due?.id && !seen.has(due.id)) {
      seen.set(due.id, due);
    }
  }

  const deduplicated = Array.from(seen.values());

  // Silently drop duplicates — no logging in production

  return deduplicated;
}

export function loadDues(): CustomerDue[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // No seed/demo data — return empty array
      return [];
    }
    const parsed = JSON.parse(raw) as CustomerDue[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    
    // Sanitize to remove any duplicate IDs
    return sanitizeDues(parsed);
  } catch {
    return [];
  }
}

export function saveDues(dues: CustomerDue[]) {
  if (typeof window !== "undefined") {
    // Always sanitize before saving to prevent duplicate persistence
    const sanitized = sanitizeDues(dues);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  }
}

export function createDueId() {
  // Use crypto.randomUUID for globally unique IDs instead of timestamp-based
  // This prevents collision issues with rapid creates/undos
  try {
    if (typeof window !== "undefined" && typeof crypto !== "undefined") {
      return `due_${crypto.randomUUID()}`;
    }
  } catch {
    // Fallback if crypto is not available
  }
  // Fallback for older browsers or server-side
  return `due_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
