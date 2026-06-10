"use client";

import { Loader2, RefreshCw, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDue } from "@/contexts/due-context";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import type { StatusFilter } from "@/lib/due/types";
import { DueCard } from "./due-card";
import { EmptyState } from "@/components/ui/empty-state";
import { TimelineSkeleton } from "@/components/ui/skeleton-loaders";
import { cn } from "@/lib/utils";

const FILTER_TABS: { id: StatusFilter; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "paid", label: "Paid" },
  { id: "all", label: "All" },
];

export function DueList() {
  const {
    filteredDues,
    isHydrated,
    isRefreshing,
    refreshDues,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    markAsPaid,
    sendWhatsAppReminder,
    openEditDue,
    deleteDue,
  } = useDue();

  const { pullDistance, pullHandlers, pullStyle } = usePullToRefresh(refreshDues, isRefreshing);

  return (
    <section className="space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <h2 className="saas-section-title">Customers</h2>
          <p className="saas-meta">{filteredDues.length} records</p>
        </div>
        <button
          type="button"
          onClick={() => refreshDues()}
          disabled={isRefreshing}
          className="w-10 h-10 shrink-0 rounded-xl glass-panel flex items-center justify-center border border-border/50 dark:border-white/10 active:scale-95 transition-transform"
          aria-label="Refresh dues"
        >
          <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isRefreshing && "animate-spin")} />
        </button>
      </div>

      <div className="relative min-w-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
        <Input
          type="search"
          placeholder="Search customer, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-10 rounded-xl bg-muted/50 dark:bg-white/5 border border-[var(--border)] text-base w-full"
        />
      </div>

      <div className="flex gap-2 min-w-0">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "flex-1 min-h-10 rounded-full text-xs font-semibold transition-colors",
              statusFilter === tab.id
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
          <TimelineSkeleton count={3} />
        ) : filteredDues.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="No dues found"
            description={
              searchQuery ? "Try another search or change the filter" : "Tap + to add a customer due"
            }
            variant="orange"
          />
        ) : (
          <ul className="space-y-2.5">
            {filteredDues.map((due) => (
              <li key={due.id}>
                <DueCard
                  due={due}
                  onMarkPaid={markAsPaid}
                  onWhatsApp={sendWhatsAppReminder}
                  onEdit={openEditDue}
                  onDelete={deleteDue}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
