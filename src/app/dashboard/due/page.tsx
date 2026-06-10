"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import { AnimatedPage, itemVariants } from "@/components/animated-page";
import { DueList } from "@/components/due/due-list";
import { DueStatsRow } from "@/components/due/due-stats-row";
import { useDue } from "@/contexts/due-context";
import { Button } from "@/components/ui/button";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function DuePageContent() {
  const { openAddDue, openEditDue } = useDue();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDemo = pathname?.startsWith("/demo");
  const backHref = isDemo ? "/demo" : "/dashboard";

  useEffect(() => {
    const editId = searchParams?.get("edit");
    if (editId) {
      openEditDue(editId);
    }
  }, [searchParams, openEditDue]);

  return (
    <AnimatedPage className="page-shell pb-28">
      <div
        className="ambient-orb top-[-6%] left-[-8%] w-[38%] h-[26%] opacity-70"
        style={{
          background: "radial-gradient(circle, rgb(251 146 60 / 0.22) 0%, transparent 70%)",
        }}
      />

      <header className="sticky top-0 z-40 glass-panel-heavy border-x-0 border-t-0 border-b border-white/10 px-4 md:px-6 py-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="w-10 h-10 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-gradient">Customer Due</h1>
            <p className="saas-meta">Track pending & paid credit</p>
          </div>
          <Button
            size="sm"
            onClick={() => openAddDue()}
            className="h-10 px-3 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 shadow-[0_0_16px_rgb(251,146,60/0.2)]"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </header>

      <div className="page-content flex flex-col gap-5">
        <motion.div variants={itemVariants}>
          <DueStatsRow />
        </motion.div>

        <motion.div variants={itemVariants}>
          <DueList />
        </motion.div>
      </div>
    </AnimatedPage>
  );
}

export default function DuePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DuePageContent />
    </Suspense>
  );
}
