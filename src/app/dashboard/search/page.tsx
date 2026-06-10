"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search as SearchIcon, Receipt, TrendingDown, Users, Loader2, X } from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { useAuth } from "@/contexts/auth-context";
import { performGlobalSearch, type SearchResultItem } from "@/lib/supabase/search";
import { useDebounce } from "@/hooks/use-debounce";

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    // Auto-focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    async function search() {
      if (!user?.id || debouncedQuery.length < 2) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const data = await performGlobalSearch(user.id, debouncedQuery);
      setResults(data);
      setIsSearching(false);
    }

    search();
  }, [debouncedQuery, user?.id]);

  const clearSearch = () => {
    setQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const salesResults = results.filter(r => r.type === 'sale');
  const expenseResults = results.filter(r => r.type === 'expense');
  const dueResults = results.filter(r => r.type === 'due');

  const renderResultItem = (item: SearchResultItem, icon: React.ReactNode, colorClass: string) => (
    <Link href={item.url} key={item.id} className="flex items-center justify-between gap-3 p-4 border-b border-white/5 hover:bg-white/5 transition-colors active:bg-white/10 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors ${colorClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
        </div>
      </div>
      <div className={`font-semibold text-sm whitespace-nowrap ${colorClass}`}>
        {item.type === 'expense' ? '-' : ''}₹{Number(item.amount).toLocaleString("en-IN")}
      </div>
    </Link>
  );

  return (
    <AnimatedPage className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Ambient Lighting */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-full h-[50%] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header Search Bar */}
      <header className="flex-none p-4 pb-2 relative z-10 glass-panel-heavy border-b border-white/10">
        <div className="flex items-center gap-3 max-w-lg mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sales, expenses, customers..."
              className="w-full h-12 pl-10 pr-10 rounded-[18px] bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-white/10 transition-all placeholder:text-muted-foreground"
            />
            <AnimatePresence>
              {query.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={clearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto w-full space-y-8">
          
          {query.length > 0 && query.length < 2 && (
            <div className="text-center text-muted-foreground text-sm mt-10">
              Type at least 2 characters to search
            </div>
          )}

          {isSearching && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Searching business records...</p>
            </div>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <SearchIcon className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <h3 className="text-foreground font-medium">No results found</h3>
              <p className="text-sm text-muted-foreground text-center">We couldn't find anything matching "{query}"</p>
            </div>
          )}

          {!isSearching && query.length >= 2 && results.length > 0 && (
            <div className="space-y-6 pb-safe">
              {salesResults.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 ml-2 flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5" /> Sales
                  </h3>
                  <div className="premium-card overflow-hidden">
                    {salesResults.map(r => renderResultItem(r, <Receipt className="w-5 h-5" />, "text-primary"))}
                  </div>
                </section>
              )}

              {expenseResults.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3 ml-2 flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5" /> Expenses
                  </h3>
                  <div className="premium-card overflow-hidden">
                    {expenseResults.map(r => renderResultItem(r, <TrendingDown className="w-5 h-5" />, "text-rose-400"))}
                  </div>
                </section>
              )}

              {dueResults.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3 ml-2 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Customers & Dues
                  </h3>
                  <div className="premium-card overflow-hidden">
                    {dueResults.map(r => renderResultItem(r, <Users className="w-5 h-5" />, "text-orange-400"))}
                  </div>
                </section>
              )}
            </div>
          )}

        </div>
      </div>
    </AnimatedPage>
  );
}
