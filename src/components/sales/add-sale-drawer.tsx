"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Banknote, CreditCard, Smartphone } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = editingId !== null;
  const editingSale = isEditing ? sales.find((s) => s.id === editingId) : null;

  // Body scroll lock
  useEffect(() => {
    if (addSaleOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [addSaleOpen]);

  // ESC key to close
  useEffect(() => {
    if (!addSaleOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAddSale();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addSaleOpen, closeAddSale]);

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
      const t = setTimeout(() => amountRef.current?.focus(), 200);
      return () => clearTimeout(t);
    } else {
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
    <AnimatePresence>
      {addSaleOpen && (
        <motion.div
          key="sale-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 50,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            background: "rgba(0,0,0,0.85)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddSale();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              maxWidth: "1400px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            {/* ─── Sticky Header ─────────────────────────────────────── */}
            <div
              style={{ position: "sticky", top: 0, zIndex: 50 }}
              className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-black/60 backdrop-blur-xl shrink-0"
            >
              <button
                type="button"
                onClick={closeAddSale}
                className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center shrink-0 hover:bg-white/12 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-foreground/80" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-gradient leading-tight">
                  {isEditing ? "Edit Sale" : "Add Sale"}
                </h2>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {isEditing ? "Update the sale details" : "Record a sale in seconds — amount first"}
                </p>
              </div>
            </div>

            {/* ─── Scrollable Content ─────────────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto px-5 py-6 space-y-6"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style>{`
                .sale-modal-scroll::-webkit-scrollbar { width: 0px; display: none; }
              `}</style>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
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

              {/* Bottom padding so footer doesn't cover content */}
              <div className="h-4" />
            </div>

            {/* ─── Sticky Footer ──────────────────────────────────────── */}
            <div
              style={{ position: "sticky", bottom: 0, zIndex: 50 }}
              className="flex gap-3 px-5 py-4 border-t border-white/10 bg-black/60 backdrop-blur-xl shrink-0"
            >
              <Button
                variant="outline"
                size="lg"
                onClick={closeAddSale}
                className="flex-1 h-12 rounded-xl border-border/50 dark:border-white/15 bg-muted/50 dark:bg-white/5 text-base"
              >
                Cancel
              </Button>
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
