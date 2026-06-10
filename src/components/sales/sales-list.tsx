"use client";

import { Loader2, Receipt, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSales } from "@/contexts/sales-context";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import type { DateFilter } from "@/lib/sales/types";
import { SaleTransactionCard } from "./sale-transaction-card";
import { EmptyState } from "@/components/ui/empty-state";
import { TimelineSkeleton } from "@/components/ui/skeleton-loaders";
import { cn } from "@/lib/utils";

const FILTER_TABS: { id: DateFilter | "all"; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "All" },
];

export function SalesList() {
  const {
    filteredSales,
    isHydrated,
    isRefreshing,
    refreshSales,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    listStats,
  } = useSales();

  const { pullDistance, pullHandlers, pullStyle } = usePullToRefresh(refreshSales, isRefreshing);

  return (
    <section className="space-y-3 min-w-0 w-full">
      <div className="flex items-center justify-between gap-2 px-0.5 min-w-0">
        <div className="min-w-0">
          <h2 className="saas-section-title">Sales history</h2>
          <p className="saas-meta truncate">
            {listStats.count} orders · ₹{listStats.total.toLocaleString("en-IN")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshSales()}
          disabled={isRefreshing}
          className="w-10 h-10 shrink-0 rounded-xl glass-panel flex items-center justify-center border border-border/50 dark:border-white/10 active:scale-95 transition-transform"
          aria-label="Refresh sales"
        >
          <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isRefreshing && "animate-spin")} />
        </button>
      </div>

      <div className="relative min-w-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
        <Input
          type="search"
          placeholder="Search item, amount, UPI..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-10 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/12 text-base w-full"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none max-w-full">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setDateFilter(tab.id)}
            className={cn(
              "shrink-0 min-h-10 px-4 rounded-full text-xs font-semibold transition-colors",
              dateFilter === tab.id
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgb(var(--glow-primary)/0.35)]"
                : "bg-muted/50 dark:bg-white/6 border border-border/50 dark:border-white/10 text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {pullDistance > 20 && (
        <p className="text-center text-xs text-muted-foreground">
          {isRefreshing ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...
            </span>
          ) : pullDistance > 64 ? (
            "Release to refresh"
          ) : (
            "Pull down to refresh"
          )}
        </p>
      )}

      <div {...pullHandlers} style={pullStyle} className="min-w-0">
        {!isHydrated ? (
          <TimelineSkeleton count={4} />
        ) : filteredSales.length === 0 ? (
          <EmptyState
            icon={<Receipt />}
            title="No sales found"
            description={
              searchQuery
                ? "Try a different search or clear filters"
                : "Tap + to record your first sale for this period"
            }
            variant="primary"
          />
        ) : (
          <div className="relative before:absolute before:inset-y-0 before:left-[21px] before:w-[2px] before:bg-gradient-to-b before:from-white/10 before:via-white/5 before:to-transparent space-y-4 pb-4 mt-2">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="relative z-10">
                <SaleTransactionCard sale={sale} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
