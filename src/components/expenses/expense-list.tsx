"use client";

import { motion } from "framer-motion";
import { Clock, Search, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useExpenses } from "@/contexts/expenses-context";
import { ExpenseCard } from "./expense-card";
import { EmptyState } from "@/components/ui/empty-state";
import { TimelineSkeleton } from "@/components/ui/skeleton-loaders";
import { itemVariants } from "@/components/animated-page";

export function ExpensesList() {
  const {
    filteredExpenses,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    isHydrated,
  } = useExpenses();

  if (!isHydrated) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
        </div>
        <TimelineSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search expenses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15 focus-visible:ring-rose-400/40"
        />
      </motion.div>

      {/* List */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<TrendingDown />}
          title="No expenses yet"
          description="Add your first expense to get started"
          variant="rose"
        />
      ) : (
        <div className="relative before:absolute before:inset-y-0 before:left-[21px] before:w-[2px] before:bg-gradient-to-b before:from-rose-500/10 before:via-rose-500/5 before:to-transparent space-y-4 pb-4 mt-2">
          {filteredExpenses.map((expense) => (
            <motion.div key={expense.id} variants={itemVariants} className="relative z-10">
              <ExpenseCard expense={expense} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
