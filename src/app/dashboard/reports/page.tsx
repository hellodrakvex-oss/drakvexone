"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Users,
  BarChart3,
  Receipt,
  FileDown,
  MessageCircle,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { useAuth } from "@/contexts/auth-context";
import { getDailyReport } from "@/lib/reports/api";
import { generateDailyReportPDF } from "@/lib/reports/pdf";
import { shareReportOnWhatsApp } from "@/lib/reports/whatsapp";
import type { DailyReport, ReportDateRange } from "@/lib/reports/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isoDate(date: Date): string {
  if (!date || isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function dateFromIso(iso: string): Date {
  if (!iso) return new Date();
  return new Date(iso + "T00:00:00");
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────
function ReportSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded-xl" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="h-4 w-28 bg-white/5 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-14 bg-white/5 rounded-xl" />
            <div className="h-14 bg-white/5 rounded-xl" />
            <div className="h-14 bg-white/5 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: "green" | "red" | "blue" | "orange" | "default";
  icon?: React.ReactNode;
  large?: boolean;
}

function MetricCard({ label, value, sub, color = "default", icon, large }: MetricCardProps) {
  const colorMap = {
    green: "text-emerald-400",
    red: "text-rose-400",
    blue: "text-blue-400",
    orange: "text-orange-400",
    default: "text-foreground",
  };
  const bgMap = {
    green: "bg-emerald-500/10 ring-emerald-500/20",
    red: "bg-rose-500/10 ring-rose-500/20",
    blue: "bg-blue-500/10 ring-blue-500/20",
    orange: "bg-orange-500/10 ring-orange-500/20",
    default: "bg-white/5 ring-white/10",
  };

  return (
    <div className={cn("rounded-xl p-3.5 ring-1 flex flex-col gap-1.5", bgMap[color])}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon && <span className="opacity-70">{icon}</span>}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("font-bold leading-tight", large ? "text-2xl" : "text-lg", colorMap[color])}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Section Panel ───────────────────────────────────────────────────────────
function ReportSection({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className={cn("px-4 py-3 border-b border-white/5 flex items-center gap-2", accent)}>
        <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/70">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Date Picker Bar ─────────────────────────────────────────────────────────
function DateBar({
  range,
  onRange,
  date,
  onDate,
}: {
  range: ReportDateRange;
  onRange: (r: ReportDateRange) => void;
  date: Date;
  onDate: (d: Date) => void;
}) {
  const tabs: { id: ReportDateRange; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "custom", label: "Custom" },
  ];

  const shiftDay = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    onDate(d);
    onRange("custom");
  };

  return (
    <div className="space-y-3">
      {/* Quick tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl ring-1 ring-white/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onRange(t.id)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
              range === t.id
                ? "bg-primary text-primary-foreground shadow-[0_0_16px_rgb(var(--glow-primary)/0.4)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Date navigator — only shown in custom mode or always */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => shiftDay(-1)}
          className="w-9 h-9 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-foreground">{formatDate(date)}</p>
        </div>
        <button
          onClick={() => shiftDay(1)}
          disabled={isoDate(date) >= isoDate(new Date())}
          className="w-9 h-9 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Native date input for custom */}
      {range === "custom" && (
        <input
          type="date"
          value={isoDate(date)}
          max={isoDate(new Date())}
          onChange={(e) => {
            if (e.target.value) {
              onDate(dateFromIso(e.target.value));
            }
          }}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<ReportDateRange>("today");
  const [date, setDate] = useState<Date>(new Date());
  const [report, setReport] = useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Sync date when tab changes
  useEffect(() => {
    if (range === "today") {
      setDate(new Date());
    } else if (range === "yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      setDate(d);
    }
  }, [range]);

  const loadReport = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDailyReport(user.id, date);
      setReport(data);
    } catch (err: any) {
      console.error("[Reports Page] Failed to load report:", err);
      setError(err?.message || "Failed to load report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user, date]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  async function handleExportPDF() {
    if (!report) return;
    setIsPdfLoading(true);
    try {
      await generateDailyReportPDF(report);
      toast.success("PDF downloaded!", { description: `daily-report-${report.date}.pdf` });
    } catch (err: any) {
      console.error("[PDF Export] Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsPdfLoading(false);
    }
  }

  function handleWhatsApp() {
    if (!report) return;
    setIsSharing(true);
    try {
      shareReportOnWhatsApp(report);
      toast.success("Opening WhatsApp…");
    } finally {
      setTimeout(() => setIsSharing(false), 1500);
    }
  }

  const hasData = report && (report.totalSales > 0 || report.totalExpenses > 0 || report.dueAdded > 0);

  return (
    <AnimatedPage className="min-h-screen bg-background">
      {/* Ambient orbs */}
      <div className="ambient-orb top-[-5%] right-[-10%] w-[40%] h-[25%] opacity-60"
        style={{ background: "radial-gradient(circle, rgb(var(--glow-primary) / 0.2) 0%, transparent 70%)" }} />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glass-panel-heavy border-x-0 border-t-0 border-b border-white/10 px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">Reports</h1>
          <p className="text-[11px] text-muted-foreground">Daily closing summary</p>
        </div>
        <button
          onClick={loadReport}
          disabled={isLoading}
          className="w-9 h-9 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </button>
      </header>

      <div className="px-4 pt-5 pb-32 space-y-5">

        {/* Date Picker */}
        <DateBar range={range} onRange={setRange} date={date} onDate={setDate} />

        {/* Loading State */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReportSkeleton />
            </motion.div>
          ) : error ? (
            /* Error State */
            <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass-panel rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Failed to load report</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <button
                  onClick={loadReport}
                  className="mt-2 px-4 py-2 bg-primary/20 text-primary rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          ) : !hasData ? (
            /* Empty State */
            <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="glass-panel rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-primary/60" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">No data for this day</p>
                  <p className="text-sm text-muted-foreground">
                    Record sales, expenses or dues to generate a report.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Report Content */
            <motion.div key="report" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* ── Business Summary ────────────────────────────────────────── */}
              <ReportSection title="Business Summary">
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard
                    label="Total Sales"
                    value={`₹${report!.totalSales.toLocaleString("en-IN")}`}
                    sub={`${report!.salesCount} transactions`}
                    color="green"
                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                    large
                  />
                  <MetricCard
                    label="Net Profit"
                    value={`₹${Math.abs(report!.netProfit).toLocaleString("en-IN")}`}
                    sub={`${report!.netProfit >= 0 ? "+" : "-"}${report!.profitMarginPercent}% margin`}
                    color={report!.netProfit >= 0 ? "green" : "red"}
                    icon={<IndianRupee className="w-3.5 h-3.5" />}
                    large
                  />
                  <MetricCard
                    label="Expenses"
                    value={`₹${report!.totalExpenses.toLocaleString("en-IN")}`}
                    sub={`${report!.expensesCount} items`}
                    color="red"
                    icon={<TrendingDown className="w-3.5 h-3.5" />}
                  />
                  <MetricCard
                    label="Cash Sales"
                    value={`₹${report!.cashSales.toLocaleString("en-IN")}`}
                    sub={`UPI ₹${report!.upiSales.toLocaleString("en-IN")}`}
                    color="blue"
                    icon={<Receipt className="w-3.5 h-3.5" />}
                  />
                </div>
              </ReportSection>

              {/* ── Due Summary ──────────────────────────────────────────────── */}
              <ReportSection title="Due Summary">
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    label="Due Added"
                    value={`₹${report!.dueAdded.toLocaleString("en-IN")}`}
                    sub={`${report!.newDuesCount} new`}
                    color="red"
                    icon={<AlertCircle className="w-3.5 h-3.5" />}
                  />
                  <MetricCard
                    label="Collected"
                    value={`₹${report!.dueCollected.toLocaleString("en-IN")}`}
                    color="green"
                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                  />
                  <MetricCard
                    label="Pending"
                    value={`₹${report!.pendingDueBalance.toLocaleString("en-IN")}`}
                    color={report!.pendingDueBalance > 0 ? "orange" : "green"}
                    icon={<Users className="w-3.5 h-3.5" />}
                  />
                </div>
              </ReportSection>

              {/* ── Performance Metrics ──────────────────────────────────────── */}
              <ReportSection title="Performance Metrics">
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    label="Customers"
                    value={`${report!.uniqueCustomersCount}`}
                    icon={<Users className="w-3.5 h-3.5" />}
                  />
                  <MetricCard
                    label="Transactions"
                    value={`${report!.transactionsTotal}`}
                    icon={<BarChart3 className="w-3.5 h-3.5" />}
                  />
                  <MetricCard
                    label="Avg Sale"
                    value={`₹${Math.round(report!.averageSaleValue).toLocaleString("en-IN")}`}
                    icon={<IndianRupee className="w-3.5 h-3.5" />}
                  />
                </div>
              </ReportSection>

              {/* ── Profit Indicator Bar ─────────────────────────────────────── */}
              {report!.totalSales > 0 && (
                <div className="glass-panel rounded-2xl px-4 py-3 space-y-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Expenses vs Sales</span>
                    <span>{report!.profitMarginPercent}% profit margin</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (report!.totalExpenses / report!.totalSales) * 100)}%`,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="text-emerald-400">₹{report!.totalSales.toLocaleString("en-IN")} sales</span>
                    <span className="text-rose-400">₹{report!.totalExpenses.toLocaleString("en-IN")} expenses</span>
                  </div>
                </div>
              )}

              {/* ── Export Actions ───────────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleExportPDF}
                  disabled={isPdfLoading}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 bg-primary/15 hover:bg-primary/25 text-primary ring-1 ring-primary/30 rounded-2xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {isPdfLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  Export PDF
                </button>
                <button
                  onClick={handleWhatsApp}
                  disabled={isSharing}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 ring-1 ring-emerald-500/30 rounded-2xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  {isSharing ? "Opening…" : "WhatsApp"}
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
}
