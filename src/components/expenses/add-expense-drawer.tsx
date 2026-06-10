"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useExpenses } from "@/contexts/expenses-context";
import { EXPENSE_CATEGORIES } from "@/lib/expenses/types";
import type { ExpenseCategory } from "@/lib/expenses/types";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000, 2500];

export function AddExpenseDrawer() {
  const {
    addExpenseOpen,
    addExpensePreset,
    editingId,
    closeAddExpense,
    addExpense,
    editExpense,
    expenses,
  } = useExpenses();
  const amountRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = editingId !== null;
  const editingExpense = isEditing ? expenses.find((e) => e.id === editingId) : null;

  useEffect(() => {
    setErrors({});
    if (addExpenseOpen) {
      if (isEditing && editingExpense) {
        setAmount(String(editingExpense.amount));
        setCategory(editingExpense.category);
        setDescription(editingExpense.description ?? "");
        setNotes(editingExpense.notes ?? "");
      } else {
        setAmount(addExpensePreset?.amount ? String(addExpensePreset.amount) : "");
        setCategory(addExpensePreset?.category ?? "other");
        setDescription(addExpensePreset?.description ?? "");
        setNotes(addExpensePreset?.notes ?? "");
      }
      const t = setTimeout(() => amountRef.current?.focus(), 120);
      return () => clearTimeout(t);
    } else {
      setAmount("");
      setCategory("other");
      setDescription("");
      setNotes("");
    }
  }, [addExpenseOpen, addExpensePreset, isEditing, editingExpense]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const value = Number(amount);
    
    if (!amount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(value) || value <= 0) {
      newErrors.amount = "Enter a valid positive amount";
    } else if (value > 1000000) {
      newErrors.amount = "Amount too large (max ₹10,00,000)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if (isSaving) return;
    
    if (!validate()) {
      amountRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        amount: Number(amount),
        category,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      
      if (isEditing && editingId) {
        editExpense(editingId, payload);
      } else {
        addExpense(payload);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer open={addExpenseOpen} onOpenChange={(open) => !open && closeAddExpense()} modal>
      <DrawerContent
        className={cn(
          "glass-panel-heavy border-t border-border/50 dark:border-white/15 max-h-[92vh]",
          "rounded-t-2xl pb-safe",
          "[&>div:first-child]:bg-foreground/15 [&>div:first-child]:w-12"
        )}
      >
        <DrawerHeader className="text-left px-5 pt-2 pb-0">
          <DrawerTitle className="text-lg font-semibold tracking-tight text-gradient">
            {isEditing ? "Edit Expense" : "Add Expense"}
          </DrawerTitle>
          <DrawerDescription className="saas-meta">
            {isEditing ? "Update the expense details" : "Track your business expenses"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-5 py-4 space-y-5 overflow-y-auto">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="expense-amount" className="saas-label">
              Amount (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-rose-400/80">
                ₹
              </span>
              <Input
                ref={amountRef}
                id="expense-amount"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value.replace(/[^0-9.]/g, ""));
                  if (errors.amount) setErrors({});
                }}
                className={cn(
                  "h-16 pl-12 pr-4 text-3xl font-semibold tabular-nums rounded-2xl",
                  "bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15 focus-visible:ring-rose-400/40",
                  "text-foreground placeholder:text-muted-foreground/40",
                  errors.amount && "border-rose-500/50 focus-visible:ring-rose-500/40"
                )}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-400">{errors.amount}</p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK_AMOUNTS.map((n) => (
                <motion.button
                  key={n}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    setAmount(String(n));
                    if (errors.amount) setErrors({});
                  }}
                  className={cn(
                    "min-h-12 px-4 rounded-xl text-sm font-semibold tabular-nums transition-colors",
                    amount === String(n)
                      ? "bg-rose-500 text-white shadow-[0_0_20px_rgb(var(--glow-rose)/0.35)]"
                      : "bg-muted/50 dark:bg-white/6 border border-border/50 dark:border-white/10 text-foreground/90 hover:bg-muted dark:hover:bg-white/10"
                  )}
                >
                  ₹{n}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="saas-label">Category</Label>
            <div className="grid grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.value}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-colors",
                    category === cat.value
                      ? "bg-rose-500/25 border border-rose-400/50 ring-1 ring-rose-400/30"
                      : "bg-muted/50 dark:bg-white/6 border border-border/50 dark:border-white/10 hover:bg-muted dark:hover:bg-white/10"
                  )}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-center leading-tight text-foreground/80">
                    {cat.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="expense-desc" className="saas-label">
              Description (Optional)
            </Label>
            <Input
              id="expense-desc"
              type="text"
              placeholder="e.g., Office Supplies"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(
                "h-12 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15",
                "focus-visible:ring-rose-400/40 text-foreground placeholder:text-muted-foreground/50"
              )}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="expense-notes" className="saas-label">
              Notes (Optional)
            </Label>
            <Textarea
              id="expense-notes"
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={cn(
                "min-h-20 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15",
                "focus-visible:ring-rose-400/40 text-foreground placeholder:text-muted-foreground/50"
              )}
            />
          </div>
        </div>

        <DrawerFooter className="px-5 pt-3 pb-4 border-t border-border/50 dark:border-white/10">
          <div className="flex gap-3">
            <DrawerClose asChild>
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
              >
                Cancel
              </Button>
            </DrawerClose>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "flex-1 h-12 rounded-xl font-semibold",
                "bg-rose-500 hover:bg-rose-600 text-white"
              )}
            >
              {isSaving ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Expense" : "Save Expense")}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
