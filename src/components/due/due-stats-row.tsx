"use client";

import { motion } from "framer-motion";
import { IndianRupee, Users, Wallet } from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";
import { itemVariants } from "@/components/animated-page";
import { useDue } from "@/contexts/due-context";

export function DueStatsRow() {
  const { stats } = useDue();

  const items = [
    {
      label: "Pending",
      value: stats.totalPending,
      sub: "total amount",
      icon: IndianRupee,
      accent: "text-orange-400",
      bg: "bg-orange-500/15 ring-orange-500/25",
      prefix: "₹",
    },
    {
      label: "Customers",
      value: stats.customersWithDue,
      sub: "with due",
      icon: Users,
      accent: "text-primary",
      bg: "bg-primary/15 ring-primary/25",
      isCount: true,
    },
    {
      label: "Collected",
      value: stats.collectedToday,
      sub: "today",
      icon: Wallet,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/15 ring-emerald-500/25",
      prefix: "₹",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((stat) => {
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
                    <span className={`text-xs font-medium ${stat.accent} opacity-70`}>
                      {stat.prefix}
                    </span>
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
