"use client";

import Link from "next/link";
import { AnimatedPage, itemVariants } from "@/components/animated-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, IndianRupee, Users, Clock, Receipt, BarChart3, Plus, Search, Bell } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, Cell } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/animated-counter";
import { DrakvexLogo } from "@/components/ui/drakvex-logo";
import { DEMO_DASHBOARD_METRICS } from "./demo-data";
import { useState } from "react";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "oklch(0.68 0.24 275)",
  },
} satisfies ChartConfig;

export default function DemoDashboard() {
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const m = DEMO_DASHBOARD_METRICS;
  const currentDate = new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AnimatedPage className="page-shell pb-32">
      {/* Ambient lighting orbs */}
      <div
        className="ambient-orb top-[-8%] left-[-12%] w-[45%] h-[32%] opacity-80"
        style={{ background: "radial-gradient(circle, rgb(var(--glow-primary) / 0.25) 0%, transparent 70%)" }}
      />
      <div
        className="ambient-orb top-[35%] right-[-15%] w-[35%] h-[28%]"
        style={{ background: "radial-gradient(circle, rgb(var(--glow-purple) / 0.15) 0%, transparent 70%)", animationDelay: "-6s" }}
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glass-panel-heavy border-x-0 border-t-0 border-b border-white/10 px-4 md:px-6 py-4 flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <DrakvexLogo size={32} variant="mono" className="opacity-80 text-primary" />
          </div>
          <div className="block sm:hidden">
            <DrakvexLogo size={24} variant="mono" className="opacity-80 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-widest text-primary/80 uppercase">
              {currentDate}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-gradient">
              {m.shopName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Search className="w-4 h-4 text-foreground/80" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative shadow-lg backdrop-blur-md transition-colors hover:bg-white/10"
          >
            <Bell className="w-4 h-4 text-foreground/80" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-background glow-primary" />
          </motion.button>
        </div>
      </header>

      <div className="page-content flex flex-col gap-8">
        
        {/* Business Pulse */}
        <motion.div variants={itemVariants}>
          <Card className="premium-card-hero drakvex-cut-lg overflow-hidden border-0 ring-0 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
            <CardContent className="p-0 relative z-10">
              <div className="p-6 pb-5">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-[14px] bg-primary/20 text-primary ring-1 ring-primary/30 shadow-[0_0_20px_rgb(var(--glow-primary)/0.25)]">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <span className="saas-label text-primary/90">Business Pulse</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">Net Margin</span>
                    <div className="flex items-center text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-full ring-1 ring-emerald-500/20">
                      +₹<AnimatedCounter value={m.profit} className="tabular-nums ml-0.5" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground">Today&apos;s Revenue</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-primary/70">₹</span>
                    <AnimatedCounter value={m.todaySales} className="saas-value" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-y border-white/5 bg-black/10 divide-x divide-white/5">
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px] font-medium text-foreground/70 uppercase tracking-wider">Expenses</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-rose-400/70">₹</span>
                    <AnimatedCounter value={m.todayExpenses} className="saas-value-sm text-rose-400 text-xl" />
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[11px] font-medium text-foreground/70 uppercase tracking-wider">Pending Dues</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-orange-400/70">₹</span>
                    <AnimatedCounter value={m.toCollect} className="saas-value-sm text-orange-400 text-xl" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 p-2 gap-2 bg-black/20">
                <Link href="/demo/sales" className="group/btn">
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-[12px] bg-white/5 border border-white/5 hover:bg-primary/15 hover:border-primary/30 transition-all">
                    <Plus className="w-4 h-4 text-primary group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-medium text-foreground/80 tracking-wide uppercase">New Sale</span>
                  </div>
                </Link>
                <Link href="/demo/expenses" className="group/btn">
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-[12px] bg-white/5 border border-white/5 hover:bg-rose-500/15 hover:border-rose-500/30 transition-all">
                    <TrendingDown className="w-4 h-4 text-rose-400 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-medium text-foreground/80 tracking-wide uppercase">Expense</span>
                  </div>
                </Link>
                <Link href="/demo/dues" className="group/btn">
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-[12px] bg-white/5 border border-white/5 hover:bg-orange-500/15 hover:border-orange-500/30 transition-all">
                    <Users className="w-4 h-4 text-orange-400 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-medium text-foreground/80 tracking-wide uppercase">Customer</span>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Chart */}
        <motion.div variants={itemVariants}>
          <Card className="premium-card glow-border group overflow-hidden border-0 ring-0 chart-atmosphere">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-60" />
            <CardHeader className="p-5 pb-2 relative z-10">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-foreground">Weekly Revenue</CardTitle>
                <p className="text-xs text-muted-foreground">Sales over the last 7 days</p>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-4 relative z-10">
              <ChartContainer config={chartConfig} className="h-[140px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-axis-tick_text]:text-[11px] [&_.recharts-cartesian-axis-tick_text]:font-medium">
                <BarChart data={m.weeklySales} margin={{ left: -20, right: 0, top: 0, bottom: 0 }} onMouseLeave={() => setActiveBar(null)}>
                  <defs>
                    <linearGradient id="colorSalesPremiumDemo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                    </linearGradient>
                    <filter id="barGlowDemo" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                  <ChartTooltip cursor={{ fill: "rgba(255,255,255,0.05)", radius: 6 }} content={<ChartTooltipContent className="chart-tooltip-premium min-w-[7rem]" hideLabel formatter={(value) => <span className="font-semibold text-foreground tabular-nums">₹{Number(value).toLocaleString("en-IN")}</span>} />} />
                  <Bar dataKey="sales" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={900}>
                    {m.weeklySales.map((_entry, index) => {
                      const isActive = activeBar === index;
                      const isLast = index === m.weeklySales.length - 1;
                      return <Cell key={`cell-${index}`} fill="url(#colorSalesPremiumDemo)" filter={isActive || isLast ? "url(#barGlowDemo)" : undefined} style={{ opacity: activeBar === null || isActive ? 1 : 0.5, transition: "opacity 0.25s ease, filter 0.25s ease", cursor: "pointer" }} onMouseEnter={() => setActiveBar(index)} />;
                    })}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Recent Expenses */}
          <motion.div variants={itemVariants}>
            <Card className="premium-card border-0 ring-0 overflow-hidden group h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent transition-opacity duration-500 group-hover:from-rose-500/10" />
              <CardHeader className="p-5 pb-3 border-b border-border/50 relative z-10">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-semibold flex items-center text-rose-400 gap-2">
                    <TrendingDown className="w-4 h-4" /> Today&apos;s Expenses
                  </CardTitle>
                  <Link href="/demo/expenses" className="text-[11px] font-semibold text-muted-foreground hover:text-rose-400 transition-colors">
                    View All
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0 relative z-10">
                <div className="flex flex-col divide-y divide-border/50">
                  {m.recentExpenses.slice(0, 3).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between gap-3 p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{expense.description || expense.category}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{expense.category}</p>
                        </div>
                      </div>
                      <div className="font-semibold text-[13px] text-rose-400 whitespace-nowrap">
                        -₹{Number(expense.amount).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Dues */}
          <motion.div variants={itemVariants}>
            <Card className="premium-card border-0 ring-0 overflow-hidden group h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent transition-opacity duration-500 group-hover:from-orange-500/10" />
              <CardHeader className="p-5 pb-3 border-b border-border/50 relative z-10">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-semibold flex items-center text-orange-400 gap-2">
                    <Users className="w-4 h-4" /> Pending Dues
                  </CardTitle>
                  <Link href="/demo/dues" className="text-[11px] font-semibold text-muted-foreground hover:text-orange-400 transition-colors">
                    Manage
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0 relative z-10">
                <div className="flex flex-col divide-y divide-border/50">
                  {m.pendingDues.slice(0, 3).map((due) => (
                    <div key={due.id} className="flex items-center justify-between gap-3 p-4 hover:bg-white/5 transition-colors">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{due.customer_name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 opacity-70" /> Due {new Date(due.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="font-semibold text-[13px] text-foreground tabular-nums">
                          ₹{Number(due.amount).toLocaleString("en-IN")}
                        </span>
                        <Link href="/demo/dues" className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 hover:bg-orange-500/20 transition-colors">
                          Remind
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

      </div>
    </AnimatedPage>
  );
}
