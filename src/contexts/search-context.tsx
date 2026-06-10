"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "./auth-context";
import { useDebounce } from "@/hooks/use-debounce";

export type SearchResult = {
  id: string;
  type: "sale" | "expense" | "customer";
  title: string;
  subtitle?: string;
  amount: number;
  date: string;
  path: string;
};

type SearchContextValue = {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isSearching: boolean;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim() || !user?.id) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const q = `%${debouncedQuery}%`;

      try {
        const [salesRes, expensesRes, duesRes] = await Promise.all([
          supabase
            .from("sales")
            .select("id, description, amount, created_at")
            .eq("user_id", user.id)
            .ilike("description", q)
            .limit(5),
          supabase
            .from("expenses")
            .select("id, category, description, amount, created_at")
            .eq("user_id", user.id)
            .ilike("category", q)
            .limit(5),
          supabase
            .from("customer_dues")
            .select("id, customer_name, phone, amount, due_date")
            .eq("user_id", user.id)
            .or(`customer_name.ilike.${q},phone.ilike.${q}`)
            .limit(5),
        ]);

        const formattedResults: SearchResult[] = [];

        if (salesRes.data) {
          salesRes.data.forEach((s) => {
            formattedResults.push({
              id: s.id,
              type: "sale",
              title: s.description || "Sale",
              amount: s.amount,
              date: s.created_at,
              path: `/dashboard/sales?edit=${s.id}`,
            });
          });
        }

        if (expensesRes.data) {
          expensesRes.data.forEach((e) => {
            formattedResults.push({
              id: e.id,
              type: "expense",
              title: e.category || "Expense",
              subtitle: e.description,
              amount: e.amount,
              date: e.created_at,
              path: `/dashboard/expenses?edit=${e.id}`,
            });
          });
        }

        if (duesRes.data) {
          duesRes.data.forEach((d) => {
            formattedResults.push({
              id: d.id,
              type: "customer",
              title: d.customer_name,
              subtitle: d.phone,
              amount: d.amount,
              date: d.due_date,
              path: `/dashboard/due?edit=${d.id}`,
            });
          });
        }

        // Sort by date desc (most recent first)
        formattedResults.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setResults(formattedResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }

    performSearch();
  }, [debouncedQuery, user?.id]);

  const value = useMemo(
    () => ({
      isOpen,
      openSearch,
      closeSearch,
      query,
      setQuery,
      results,
      isSearching,
    }),
    [isOpen, openSearch, closeSearch, query, results, isSearching]
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
