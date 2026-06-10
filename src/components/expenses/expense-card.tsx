"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useExpenses } from "@/contexts/expenses-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EXPENSE_CATEGORIES } from "@/lib/expenses/types";
import type { Expense } from "@/lib/expenses/types";
import { cn } from "@/lib/utils";

export function ExpenseCard({ expense }: { expense: Expense }) {
  const { openEditExpense, deleteExpense } = useExpenses();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = useCallback(() => {
    openEditExpense(expense.id);
  }, [openEditExpense, expense.id]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      deleteExpense(expense.id);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteExpense, expense.id]);

  const category = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);
  const date = new Date(expense.createdAt);
  const timeStr = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <article
        data-no-pull
        className="flex items-start gap-4 min-w-0 group relative"
      >
        <div
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center shrink-0 ring-[6px] ring-background bg-background z-10 relative",
          )}
        >
          <div className="w-full h-full rounded-full flex items-center justify-center bg-rose-500/12 text-rose-400 ring-1 ring-rose-500/25 text-lg">
            {category?.icon}
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="drakvex-cut-sm bg-black/10 border border-white/5 p-3.5 flex flex-col gap-2 transition-colors hover:bg-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-semibold text-foreground/95 truncate">
                  {category?.label || expense.category}
                </p>
                {expense.description && (
                  <p className="text-xs text-foreground/60 truncate leading-tight mb-1.5">{expense.description}</p>
                )}
                <div className="flex items-center gap-1.5 saas-label min-w-0 text-[9px]">
                  <span className="truncate">{timeStr}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                  <span className="shrink-0 text-rose-400/80">OUTWARD</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <p className="saas-value-sm text-base text-rose-400 shrink-0">
                  -₹{expense.amount.toLocaleString("en-IN")}
                </p>
                
                <div className="flex items-center gap-1 opacity-75 hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
                    aria-label="Edit expense"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
                    aria-label="Delete expense"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete expense?"
        description={`Remove ₹${expense.amount.toLocaleString("en-IN")} ${expense.description ? `(${expense.description})` : "expense"} from records?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={isDeleting}
        variant="destructive"
      />
    </>
  );
}
