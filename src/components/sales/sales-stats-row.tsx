"use client";

import { motion } from "framer-motion";
import { IndianRupee, Receipt, TrendingUp } from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";
import { useSales } from "@/contexts/sales-context";
import { itemVariants } from "@/components/animated-page";

export function SalesStatsRow() {
  const { todayStats } = useSales();

  const stats = [
    {
      label: "Today",
      value: todayStats.total,
      sub: "sales total",
      icon: IndianRupee,
      accent: "text-primary",
      bg: "bg-primary/15 ring-primary/25",
    },
    {
      label: "Orders",
      value: todayStats.count,
      sub: "today",
      icon: Receipt,
      accent: "text-sky-400",
      bg: "bg-sky-500/15 ring-sky-500/25",
      isCount: true,
    },
    {
      label: "Avg order",
      value: todayStats.average,
      sub: "today",
      icon: TrendingUp,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/15 ring-emerald-500/25",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div key={stat.label} variants={itemVariants}>
            <div className="premium-card border-0 ring-0 p-3.5 space-y-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ring-1 ${stat.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${stat.accent}`} />
              </div>
              <div>
                <p className="saas-label text-[9px]">{stat.label}</p>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                  {!stat.isCount && (
                    <span className={`text-xs font-medium ${stat.accent} opacity-70`}>₹</span>
                  )}
                  <AnimatedCounter
                    value={stat.value}
                    className="text-xl font-semibold tracking-tight tabular-nums"
                  />
                </div>
                <p className="saas-meta mt-0.5">{stat.sub}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
