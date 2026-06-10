"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import { AnimatedPage, itemVariants } from "@/components/animated-page";
import { SalesList } from "@/components/sales/sales-list";
import { SalesQuickActions } from "@/components/sales/sales-quick-actions";
import { SalesStatsRow } from "@/components/sales/sales-stats-row";
import { SalesSummaryStrip } from "@/components/sales/sales-summary-strip";
import { useSales } from "@/contexts/sales-context";
import { Button } from "@/components/ui/button";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function SalesPageContent() {
  const { openAddSale, openEditSale } = useSales();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDemo = pathname?.startsWith("/demo");
  const backHref = isDemo ? "/demo" : "/dashboard";

  useEffect(() => {
    const editId = searchParams?.get("edit");
    if (editId) {
      openEditSale(editId);
    }
  }, [searchParams, openEditSale]);

  return (
    <AnimatedPage className="page-shell pb-28">
      <div
        className="ambient-orb top-[-6%] right-[-10%] w-[40%] h-[28%] opacity-70 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgb(var(--glow-primary) / 0.3) 0%, transparent 70%)" }}
      />

      <header className="sticky top-0 z-40 glass-panel-heavy border-x-0 border-t-0 border-b border-border/40 dark:border-white/10 px-4 md:px-6 py-4 mb-5 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={backHref}
            className="w-10 h-10 rounded-xl bg-muted/50 dark:bg-white/6 border border-border/50 dark:border-white/10 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-gradient truncate">Sales</h1>
            <p className="saas-meta">Manage daily transactions</p>
          </div>
          <Button
            size="sm"
            onClick={() => openAddSale()}
            className="h-10 px-3 shrink-0 rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </header>

      <div className="page-content flex flex-col gap-5">
        <motion.div variants={itemVariants} className="min-w-0">
          <SalesStatsRow />
        </motion.div>

        <motion.div variants={itemVariants} className="min-w-0">
          <SalesSummaryStrip />
        </motion.div>

        <motion.div variants={itemVariants} className="min-w-0">
          <SalesQuickActions />
        </motion.div>

        <motion.div variants={itemVariants} className="min-w-0">
          <SalesList />
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SalesPageContent />
    </Suspense>
  );
}
