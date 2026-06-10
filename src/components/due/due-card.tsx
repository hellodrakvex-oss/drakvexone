"use client";

import { memo, useCallback, useState } from "react";
import { Check, ChevronDown, Copy, MessageCircle, Pencil, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CustomerDue } from "@/lib/due/types";
import {
  formatCurrency,
  formatDueDate,
  formatUpdatedTime,
} from "@/lib/due/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type DueCardProps = {
  due: CustomerDue;
  onMarkPaid: (id: string) => void;
  onWhatsApp: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function DueCardComponent({ due, onMarkPaid, onWhatsApp, onEdit, onDelete }: DueCardProps) {
  const isPending = due.status === "pending";
  const isOverdue =
    isPending && new Date(due.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const paidAmount = due.paidAmount || 0;
  const isPartiallyPaid = isPending && paidAmount > 0;
  const remaining = due.amount - paidAmount;
  const progressPct = Math.min(100, Math.round((paidAmount / due.amount) * 100));

  const handlePaid = useCallback(() => onMarkPaid(due.id), [onMarkPaid, due.id]);
  const handleWa = useCallback(() => onWhatsApp(due.id), [onWhatsApp, due.id]);
  const handleEdit = useCallback(() => onEdit(due.id), [onEdit, due.id]);
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      onDelete(due.id);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, due.id]);

  const handleCall = useCallback(() => {
    if (due.phone) {
      window.open(`tel:${due.phone.replace(/\D/g, "")}`, "_self");
    }
  }, [due.phone]);

  const handleCopy = useCallback(() => {
    if (due.phone) {
      navigator.clipboard.writeText(due.phone);
      toast.success("Phone number copied");
    }
  }, [due.phone]);

  return (
    <>
      <article data-no-pull className="premium-card border-0 ring-0 p-4 space-y-3 min-w-0 group">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3 className="text-sm font-semibold text-foreground/95 truncate">{due.customerName}</h3>
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase shrink-0",
                  isPending
                    ? isOverdue
                      ? "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25"
                      : isPartiallyPaid
                        ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25"
                        : "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/25"
                    : "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
                )}
              >
                {isPending
                  ? isOverdue
                    ? "Overdue"
                    : isPartiallyPaid
                      ? "Partial"
                      : "Pending"
                  : "Paid"}
              </span>
            </div>
            <p className={cn("saas-meta", isOverdue && isPending && "text-rose-400/90")}>
              {formatDueDate(due.dueDate)}
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              Updated {formatUpdatedTime(due.updatedAt)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p
              className={cn(
                "text-xl font-semibold tabular-nums",
                isPending ? (isPartiallyPaid ? "text-amber-400" : "text-orange-400") : "text-emerald-400/90"
              )}
            >
              ₹{formatCurrency(isPending ? remaining : due.amount)}
            </p>
            {isPartiallyPaid && (
              <p className="text-[10px] text-muted-foreground/60 tabular-nums">
                of ₹{formatCurrency(due.amount)}
              </p>
            )}
          </div>
        </div>

        {/* Partial payment progress bar */}
        {isPartiallyPaid && (
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-muted/40 dark:bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/60 tabular-nums">
              ₹{formatCurrency(paidAmount)} paid · {progressPct}% complete
            </p>
          </div>
        )}

        {due.notes && (
          <p className="text-xs text-muted-foreground/80 bg-muted/30 dark:bg-white/4 rounded-lg px-3 py-2 border border-border/50 dark:border-white/12 truncate">
            {due.notes}
          </p>
        )}

        <div className="flex gap-2">
          {isPending && (
            <>
              <button
                type="button"
                onClick={handlePaid}
                className="flex-1 min-h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 active:scale-[0.98] transition-transform"
              >
                <Check className="w-4 h-4" />
                {isPartiallyPaid ? "Settle" : "Mark paid"}
              </button>
              
              <DropdownMenu>
                <div className="flex-1 flex min-w-0 min-h-11 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 opacity-100 disabled:opacity-50 group/wa" style={{ opacity: due.phone ? 1 : 0.5 }}>
                  <button
                    type="button"
                    onClick={handleWa}
                    disabled={!due.phone}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4ade80] active:scale-[0.98] transition-transform disabled:cursor-not-allowed"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <div className="w-px bg-[#25D366]/30 my-2" />
                  <DropdownMenuTrigger
                    disabled={!due.phone}
                    className="w-10 flex items-center justify-center text-[#4ade80] active:scale-[0.98] transition-transform disabled:cursor-not-allowed outline-none focus:outline-none"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="end" className="w-48 glass-panel border-border/50">
                  <DropdownMenuItem onClick={handleWa} className="gap-2 cursor-pointer">
                    <MessageCircle className="w-4 h-4 text-[#4ade80]" />
                    Send Reminder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCall} className="gap-2 cursor-pointer">
                    <Phone className="w-4 h-4" />
                    Call Customer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy} className="gap-2 cursor-pointer">
                    <Copy className="w-4 h-4" />
                    Copy Number
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <button
            type="button"
            onClick={handleEdit}
            className={cn(
              "min-h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold bg-muted/50 dark:bg-white/6 border border-border/50 dark:border-white/12 active:scale-[0.98] transition-transform",
              isPending ? "px-4" : "flex-1"
            )}
          >
            <Pencil className="w-3.5 h-3.5" />
            {isPending ? "Edit" : "View"}
          </button>
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            className="min-h-11 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold bg-muted/50 dark:bg-white/6 border border-border/50 dark:border-white/12 active:scale-[0.98] transition-opacity duration-200 opacity-75 hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
      </article>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete due?"
        description={`Remove due from ${due.customerName} (₹${formatCurrency(due.amount)})? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={isDeleting}
        variant="destructive"
      />
    </>
  );
}

export const DueCard = memo(DueCardComponent);
