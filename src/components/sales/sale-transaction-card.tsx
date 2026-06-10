"use client";

import { memo, useCallback, useState } from "react";
import { Banknote, CreditCard, Pencil, Smartphone, Trash2 } from "lucide-react";
import type { Sale } from "@/lib/sales/types";
import { PAYMENT_LABELS } from "@/lib/sales/types";
import { formatCurrency, formatSaleTime } from "@/lib/sales/utils";
import { useSales } from "@/contexts/sales-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const PAYMENT_ICONS = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
} as const;

const PAYMENT_STYLES = {
  cash: "bg-emerald-500/12 text-emerald-400 ring-emerald-500/25",
  upi: "bg-sky-500/12 text-sky-400 ring-sky-500/25",
  card: "bg-violet-500/12 text-violet-400 ring-violet-500/25",
} as const;

type SaleTransactionCardProps = {
  sale: Sale;
};

function SaleTransactionCardComponent({ sale }: SaleTransactionCardProps) {
  const Icon = PAYMENT_ICONS[sale.paymentMethod];
  const { openEditSale, deleteSale } = useSales();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = useCallback(() => {
    openEditSale(sale.id);
  }, [openEditSale, sale.id]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      deleteSale(sale.id);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteSale, sale.id]);

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
          <div className={cn("w-full h-full rounded-full flex items-center justify-center", PAYMENT_STYLES[sale.paymentMethod])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="drakvex-cut-sm bg-black/10 border border-white/5 p-3.5 flex flex-col gap-2 transition-colors hover:bg-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-semibold text-foreground/95 truncate">
                  {sale.itemName ?? "Quick Sale"}
                </p>
                <div className="flex items-center gap-1.5 saas-label min-w-0 text-[9px]">
                  <span className="truncate">{formatSaleTime(sale.createdAt)}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                  <span className="shrink-0">{PAYMENT_LABELS[sale.paymentMethod]}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <p className="saas-value-sm text-base text-foreground shrink-0">
                  ₹{formatCurrency(sale.amount)}
                </p>
                
                <div className="flex items-center gap-1 opacity-75 hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
                    aria-label="Edit sale"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all"
                    aria-label="Delete sale"
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
        title="Delete sale?"
        description={`Remove ₹${formatCurrency(sale.amount)} ${sale.itemName ? `(${sale.itemName})` : "sale"} from records?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={isDeleting}
        variant="destructive"
      />
    </>
  );
}

export const SaleTransactionCard = memo(SaleTransactionCardComponent);
