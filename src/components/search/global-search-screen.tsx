"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, ArrowRight, IndianRupee, Store, TrendingDown, Users } from "lucide-react";
import { useSearch } from "@/contexts/search-context";

export function GlobalSearchScreen() {
  const router = useRouter();
  const { isOpen, closeSearch, query, setQuery, results, isSearching } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow animation before focus
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const salesResults = results.filter((r) => r.type === "sale");
  const expensesResults = results.filter((r) => r.type === "expense");
  const customerResults = results.filter((r) => r.type === "customer");

  const handleResultClick = (path: string) => {
    closeSearch();
    router.push(path);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-50 bg-background flex flex-col pt-safe-top"
      >
        <div className="flex items-center gap-3 p-4 border-b border-border/40">
          <button
            onClick={closeSearch}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sales, expenses, customers..."
              className="w-full h-12 bg-white/5 border border-white/10 rounded-[18px] pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center pt-10 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Searching...</p>
            </div>
          ) : query && results.length === 0 ? (
            <div className="text-center pt-10 text-muted-foreground">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <>
              {salesResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Store className="w-4 h-4" />
                    <span>Sales</span>
                  </div>
                  <div className="space-y-2">
                    {salesResults.map((result) => (
                      <ResultCard key={result.id} result={result} onClick={() => handleResultClick(result.path)} />
                    ))}
                  </div>
                </div>
              )}

              {expensesResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <TrendingDown className="w-4 h-4" />
                    <span>Expenses</span>
                  </div>
                  <div className="space-y-2">
                    {expensesResults.map((result) => (
                      <ResultCard key={result.id} result={result} onClick={() => handleResultClick(result.path)} />
                    ))}
                  </div>
                </div>
              )}

              {customerResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                    <Users className="w-4 h-4" />
                    <span>Customers & Dues</span>
                  </div>
                  <div className="space-y-2">
                    {customerResults.map((result) => (
                      <ResultCard key={result.id} result={result} onClick={() => handleResultClick(result.path)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ResultCard({ result, onClick }: { result: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{result.title}</span>
        {result.subtitle && <span className="text-xs text-muted-foreground">{result.subtitle}</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="font-semibold flex items-center">
          <IndianRupee className="w-3 h-3" />
          {result.amount.toLocaleString("en-IN")}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}
