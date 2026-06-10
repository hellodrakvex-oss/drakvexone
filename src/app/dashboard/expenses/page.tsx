"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import { AnimatedPage, itemVariants } from "@/components/animated-page";
import { ExpensesList } from "@/components/expenses/expense-list";
import { ExpenseStatsRow } from "@/components/expenses/expense-stats-row";
import { useExpenses } from "@/contexts/expenses-context";
import { Button } from "@/components/ui/button";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function ExpensesPageContent() {
  const { openAddExpense, openEditExpense } = useExpenses();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDemo = pathname?.startsWith("/demo");
  const backHref = isDemo ? "/demo" : "/dashboard";

  useEffect(() => {
    const editId = searchParams?.get("edit");
    if (editId) {
      openEditExpense(editId);
    }
  }, [searchParams, openEditExpense]);

  return (
    <AnimatedPage className="page-shell pb-28">
      <div
        className="ambient-orb top-[-6%] right-[-10%] w-[40%] h-[28%] opacity-70 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgb(var(--glow-rose) / 0.3) 0%, transparent 70%)" }}
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
            <h1 className="text-xl font-semibold tracking-tight text-gradient truncate">Expenses</h1>
            <p className="saas-meta">Track business spending</p>
          </div>
          <Button
            size="sm"
            onClick={() => openAddExpense()}
            className="h-10 px-3 shrink-0 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </header>

      <div className="page-content flex flex-col gap-5">
        <motion.div variants={itemVariants} className="min-w-0">
          <ExpenseStatsRow />
        </motion.div>

        <motion.div variants={itemVariants} className="min-w-0">
          <ExpensesList />
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExpensesPageContent />
    </Suspense>
  );
}
