"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
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
import { useSales } from "@/contexts/sales-context";
import type { PaymentMethod } from "@/lib/sales/types";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [25, 40, 60, 100, 150, 200];

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  icon: typeof Banknote;
}[] = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
];

export function AddSaleDrawer() {
  const { addSaleOpen, addSalePreset, editingId, closeAddSale, addSale, editSale, sales } = useSales();
  const amountRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState("");
  const [itemName, setItemName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = editingId !== null;
  const editingSale = isEditing ? sales.find((s) => s.id === editingId) : null;

  // Reset fields on close and initialize on open
  useEffect(() => {
    setErrors({});
    if (addSaleOpen) {
      if (isEditing && editingSale) {
        setAmount(String(editingSale.amount));
        setItemName(editingSale.itemName ?? "");
        setCustomerName(editingSale.customerName ?? "");
        setPhone(editingSale.phone ?? "");
        setPaymentMethod(editingSale.paymentMethod);
        setNotes(editingSale.notes ?? "");
      } else {
        setAmount(addSalePreset?.amount ? String(addSalePreset.amount) : "");
        setItemName(addSalePreset?.itemName ?? "");
        setCustomerName(addSalePreset?.customerName ?? "");
        setPhone(addSalePreset?.phone ?? "");
        setPaymentMethod(addSalePreset?.paymentMethod ?? "cash");
        setNotes(addSalePreset?.notes ?? "");
      }
      const t = setTimeout(() => amountRef.current?.focus(), 120);
      return () => clearTimeout(t);
    } else {
      // Reset to defaults when drawer closes
      setAmount("");
      setItemName("");
      setCustomerName("");
      setPhone("");
      setPaymentMethod("cash");
      setNotes("");
    }
  }, [addSaleOpen, addSalePreset, isEditing, editingSale]);

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
        itemName: itemName.trim() || undefined,
        customerName: customerName.trim() || undefined,
        phone: phone.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      };
      
      if (isEditing && editingId) {
        await editSale(editingId, payload);
      } else {
        await addSale(payload);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer open={addSaleOpen} onOpenChange={(open) => !open && closeAddSale()} modal>
      <DrawerContent
        className={cn(
          "glass-panel-heavy border-t border-border/50 dark:border-white/15 max-h-[92vh]",
          "rounded-t-2xl pb-safe",
          "[&>div:first-child]:bg-foreground/15 [&>div:first-child]:w-12"
        )}
      >
        <DrawerHeader className="text-left px-5 pt-2 pb-0">
          <DrawerTitle className="text-lg font-semibold tracking-tight text-gradient">
            {isEditing ? "Edit Sale" : "Add Sale"}
          </DrawerTitle>
          <DrawerDescription className="saas-meta">
            {isEditing ? "Update the sale details" : "Record a sale in seconds — amount first"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-5 py-4 space-y-5 overflow-y-auto">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="sale-amount" className="saas-label">
              Amount (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-primary/80">
                ₹
              </span>
              <Input
                ref={amountRef}
                id="sale-amount"
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
                  "bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15 focus-visible:ring-primary/40",
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
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgb(var(--glow-primary)/0.35)]"
                      : "bg-muted/50 dark:bg-white/6 border border-border/50 dark:border-white/10 text-foreground/90 hover:bg-muted dark:hover:bg-white/10"
                  )}
                >
                  ₹{n}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Item name */}
          <div className="space-y-2">
            <Label htmlFor="sale-item" className="saas-label">
              Item (optional)
            </Label>
            <Input
              id="sale-item"
              placeholder="e.g. Product / Service Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="h-12 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15 text-base"
            />
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sale-customer" className="saas-label">
                Customer Name
              </Label>
              <Input
                id="sale-customer"
                placeholder="Optional"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-phone" className="saas-label">
                Phone Number
              </Label>
              <Input
                id="sale-phone"
                type="tel"
                placeholder="Optional"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                className="h-12 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15 text-base"
              />
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-2">
            <Label className="saas-label">Payment</Label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_OPTIONS.map(({ id, label, icon: Icon }) => (
                <motion.button
                  key={id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setPaymentMethod(id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 min-h-[72px] rounded-2xl border transition-all",
                    paymentMethod === id
                      ? "bg-primary/25 border-primary/40 text-primary shadow-[0_0_24px_rgb(var(--glow-primary)/0.2)]"
                      : "bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/10 text-muted-foreground hover:border-border dark:hover:border-white/20"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="sale-notes" className="saas-label">
              Notes (optional)
            </Label>
            <Input
              id="sale-notes"
              placeholder="Table no., customer name..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-11 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15"
            />
          </div>
        </div>

        <DrawerFooter className="px-5 pb-6 pt-2 flex-row gap-3">
          <DrawerClose asChild>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12 rounded-xl border-border/50 dark:border-white/15 bg-muted/50 dark:bg-white/5 text-base"
            >
              Cancel
            </Button>
          </DrawerClose>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex-[1.4] h-12 rounded-xl text-base font-semibold",
              isSaving ? "opacity-50 cursor-not-allowed" : "",
              "bg-gradient-to-r from-primary via-violet-500 to-blue-600",
              "shadow-[0_0_28px_rgb(var(--glow-primary)/0.4)] border border-border/50 dark:border-white/20"
            )}
          >
            {isSaving ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Sale" : "Save Sale")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
