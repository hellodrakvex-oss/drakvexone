"use client";

import { useSales } from "@/contexts/sales-context";
import type { DateFilter } from "@/lib/sales/types";
import { formatCurrency } from "@/lib/sales/utils";
import { cn } from "@/lib/utils";

const PERIODS: { id: DateFilter; label: string; getTotal: (ctx: ReturnType<typeof useSales>) => number }[] = [
  { id: "today", label: "Today", getTotal: (c) => c.todayStats.total },
  { id: "week", label: "This week", getTotal: (c) => c.weekTotal },
  { id: "month", label: "This month", getTotal: (c) => c.monthTotal },
];

export function SalesSummaryStrip() {
  const ctx = useSales();
  const { dateFilter, setDateFilter } = ctx;

  return (
    <div className="grid grid-cols-3 gap-2 min-w-0 w-full">
      {PERIODS.map((period) => {
        const active = dateFilter === period.id;
        const total = period.getTotal(ctx);
        return (
          <button
            key={period.id}
            type="button"
            onClick={() => setDateFilter(period.id)}
            className={cn(
              "rounded-2xl p-3 text-left min-h-[72px] min-w-0 active:scale-[0.98] transition-transform",
              active
                ? "premium-card-hero glow-border border-0 ring-0"
                : "premium-card border-0 ring-0 opacity-90"
            )}
          >
            <p className={cn("saas-label text-[9px] truncate", active && "text-primary/90")}>
              {period.label}
            </p>
            <p className="text-base sm:text-lg font-semibold tabular-nums mt-1 tracking-tight truncate">
              ₹{formatCurrency(total)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
