"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/animated-counter";
import { itemVariants } from "@/components/animated-page";
import { TrendingDown, IndianRupee } from "lucide-react";
import { useExpenses } from "@/contexts/expenses-context";

export function ExpenseStatsRow() {
  const { todayStats, weekTotal, monthTotal } = useExpenses();

  return (
    <div className="grid grid-cols-2 gap-3.5 md:gap-4">
      <motion.div variants={itemVariants} className="col-span-1">
        <Card className="premium-card h-full border-0 ring-0">
          <CardContent className="p-4 md:p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/15 ring-1 ring-rose-500/20">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <span className="saas-label">Today Expenses</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-medium text-rose-400/70">₹</span>
                <AnimatedCounter value={todayStats.total} className="saas-value-sm text-rose-400" />
              </div>
              <p className="saas-meta">{todayStats.count} transaction</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="col-span-1">
        <Card className="premium-card h-full border-0 ring-0">
          <CardContent className="p-4 md:p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/15 ring-1 ring-orange-500/20">
                <IndianRupee className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <span className="saas-label">Month Total</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-medium text-orange-400/70">₹</span>
                <AnimatedCounter value={monthTotal} className="saas-value-sm" />
              </div>
              <p className="saas-meta">All expenses</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
