"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useExpenses } from "@/contexts/expenses-context";
import { cn } from "@/lib/utils";

type ExpenseFabProps = {
  className?: string;
};

export function ExpenseFab({ className }: ExpenseFabProps) {
  const { openAddExpense, addExpenseOpen } = useExpenses();

  return (
    <div
      className={cn(
        "fixed bottom-24 right-4 z-50 md:right-8 md:bottom-8 pointer-events-none",
        className
      )}
    >
      <motion.button
        type="button"
        whileHover={{
          scale: 1.06,
          boxShadow:
            "0 0 32px rgb(var(--glow-primary) / 0.55), 0 0 64px rgb(var(--glow-blue) / 0.25), 0 12px 32px -8px oklch(0 0 0 / 0.5)",
        }}
        whileTap={{ scale: 0.94 }}
        onClick={() => openAddExpense()}
        aria-label="Add expense"
        className={cn(
          "pointer-events-auto w-14 h-14 rounded-full",
          "bg-gradient-to-br from-rose-500 via-red-600 to-orange-600",
          "flex items-center justify-center text-white border border-white/25",
          "shadow-[0_0_24px_rgb(var(--glow-rose)/0.45),0_8px_24px_-6px_oklch(0_0_0/0.5)]"
        )}
      >
        <motion.div
          animate={{ rotate: addExpenseOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </motion.div>
      </motion.button>
    </div>
  );
}
