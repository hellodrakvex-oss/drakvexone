"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDue } from "@/contexts/due-context";
import type { DuePayment } from "@/lib/due/types";
import {
  dateInputToIso,
  defaultDueDateInput,
  formatCurrency,
  toDateInputValue,
} from "@/lib/due/utils";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  IndianRupee,
  ListChecks,
  Plus,
  ReceiptText,
} from "lucide-react";

const QUICK_AMOUNTS = [250, 500, 1000, 1500, 2000];

type DrawerView = "details" | "ledger" | "record_payment";

export function AddDueDrawer() {
  const {
    drawerOpen,
    editingId,
    closeDrawer,
    addDue,
    updateDue,
    getDueById,
    recordPayment,
    markAsPaid,
  } = useDue();

  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const paymentAmountRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDateInput());
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [notes, setNotes] = useState("");

  // Payment recording
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<DrawerView>("details");

  const isEditing = Boolean(editingId);
  const editingDue = editingId ? getDueById(editingId) : undefined;
  const payments = editingDue?.payments ?? [];
  const paidAmount = editingDue?.paidAmount ?? 0;
  const remaining = (editingDue?.amount ?? 0) - paidAmount;
  const progressPct = editingDue
    ? Math.min(100, Math.round((paidAmount / editingDue.amount) * 100))
    : 0;

  // Body scroll lock
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // ESC key to close
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view === "record_payment") {
          setView("ledger");
        } else if (view === "ledger") {
          setView("details");
        } else {
          closeDrawer();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [drawerOpen, view, closeDrawer]);

  // Reset on open / populate on edit
  useEffect(() => {
    if (drawerOpen) {
      setView("details");
      if (editingDue) {
        setCustomerName(editingDue.customerName);
        setAmount(String(editingDue.amount));
        setDueDate(toDateInputValue(editingDue.dueDate));
        setPhone(editingDue.phone ?? "");
        setNotes(editingDue.notes ?? "");
        const t = setTimeout(() => amountRef.current?.focus(), 200);
        return () => clearTimeout(t);
      }
      setCustomerName("");
      setAmount("");
      setDueDate(defaultDueDateInput());
      setPhone("");
      setPhoneError("");
      setNotes("");
      const t = setTimeout(() => nameRef.current?.focus(), 200);
      return () => clearTimeout(t);
    } else {
      setCustomerName("");
      setAmount("");
      setDueDate(defaultDueDateInput());
      setPhone("");
      setNotes("");
      setPaymentAmount("");
      setPaymentNotes("");
    }
  }, [drawerOpen, editingDue, editingId]);

  // Auto-focus payment amount when switching to record_payment view
  useEffect(() => {
    if (view === "record_payment") {
      const t = setTimeout(() => paymentAmountRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [view]);

  const handleSave = async () => {
    if (isSaving) return;
    const name = customerName.trim();
    const value = Number(amount);

    if (!name) {
      toast.error("Enter customer name");
      nameRef.current?.focus();
      return;
    }
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      amountRef.current?.focus();
      return;
    }
    if (!dueDate) {
      toast.error("Select due date");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError("Valid 10-digit WhatsApp number is required");
      return;
    }

    const payload = {
      customerName: name,
      amount: value,
      dueDate: dateInputToIso(dueDate),
      phone: phone,
      notes: notes || undefined,
    };
    setIsSaving(true);
    try {
      if (isEditing && editingId) {
        await updateDue(editingId, payload);
      } else {
        await addDue(payload);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!editingId || isRecording) return;
    const value = Number(paymentAmount);
    if (!value || value <= 0) {
      toast.error("Enter a valid payment amount");
      paymentAmountRef.current?.focus();
      return;
    }
    if (value > remaining) {
      toast.error(`Cannot exceed remaining balance of ₹${formatCurrency(remaining)}`);
      return;
    }
    setIsRecording(true);
    try {
      await recordPayment(editingId, value, paymentNotes || undefined);
      setPaymentAmount("");
      setPaymentNotes("");
      setView("ledger");
    } finally {
      setIsRecording(false);
    }
  };

  const handleFullSettle = async () => {
    if (!editingId) return;
    markAsPaid(editingId);
    closeDrawer();
  };

  function formatPaymentDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // ─── Back navigation ──────────────────────────────────────────────
  const handleBack = () => {
    if (view === "record_payment") {
      setView("ledger");
    } else if (view === "ledger") {
      setView("details");
    } else {
      closeDrawer();
    }
  };

  // ─── Header title & subtitle ──────────────────────────────────────
  const headerTitle =
    view === "ledger"
      ? `${editingDue?.customerName ?? ""} — Ledger`
      : view === "record_payment"
      ? "Record Payment"
      : isEditing
      ? "Edit Due"
      : "Add Due";

  const headerSubtitle =
    view === "ledger"
      ? "Full payment history & balance"
      : view === "record_payment"
      ? "Log a partial or full payment"
      : isEditing
      ? "Update customer due details"
      : "Track credit in seconds";

  // ─── Ledger View ─────────────────────────────────────────────────
  const LedgerView = () => (
    <div className="px-5 py-6 space-y-4">
      {/* Balance Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-xl p-3 space-y-0.5 text-center">
          <p className="text-[10px] text-muted-foreground/70 uppercase font-semibold tracking-wider">Total</p>
          <p className="text-base font-semibold tabular-nums text-foreground/90">
            ₹{formatCurrency(editingDue?.amount ?? 0)}
          </p>
        </div>
        <div className="glass-panel rounded-xl p-3 space-y-0.5 text-center">
          <p className="text-[10px] text-muted-foreground/70 uppercase font-semibold tracking-wider">Paid</p>
          <p className="text-base font-semibold tabular-nums text-emerald-400">
            ₹{formatCurrency(paidAmount)}
          </p>
        </div>
        <div className="glass-panel rounded-xl p-3 space-y-0.5 text-center">
          <p className="text-[10px] text-muted-foreground/70 uppercase font-semibold tracking-wider">Left</p>
          <p className={cn("text-base font-semibold tabular-nums", remaining > 0 ? "text-orange-400" : "text-emerald-400")}>
            ₹{formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {editingDue && editingDue.amount > 0 && (
        <div className="space-y-1.5">
          <div className="w-full h-2 rounded-full bg-muted/40 dark:bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground/60 text-right tabular-nums">
            {progressPct}% settled
          </p>
        </div>
      )}

      {/* Transaction Timeline */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
          Transaction History
        </p>

        {/* Due Created entry */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-orange-500/15 border border-orange-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <ReceiptText className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground/90">Due Created</p>
            <p className="text-[11px] text-muted-foreground/60">
              {editingDue ? formatPaymentDate(editingDue.createdAt) : ""}
            </p>
          </div>
          <p className="text-sm font-semibold tabular-nums text-orange-400 shrink-0">
            +₹{formatCurrency(editingDue?.amount ?? 0)}
          </p>
        </div>

        {/* Divider */}
        {payments.length > 0 && (
          <div className="ml-3.5 w-px h-2 bg-border/50 dark:bg-white/10" />
        )}

        {/* Payment entries */}
        {[...payments]
          .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
          .map((payment: DuePayment, idx: number) => (
            <div key={payment.id}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground/90">Payment Received</p>
                  <p className="text-[11px] text-muted-foreground/60">
                    {formatPaymentDate(payment.paymentDate)}
                    {payment.notes && ` · ${payment.notes}`}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-emerald-400 shrink-0">
                  -₹{formatCurrency(payment.amount)}
                </p>
              </div>
              {idx < payments.length - 1 && (
                <div className="ml-3.5 w-px h-2 bg-border/50 dark:bg-white/10" />
              )}
            </div>
          ))}

        {/* Remaining balance line */}
        {payments.length > 0 && remaining > 0 && (
          <>
            <div className="ml-3.5 w-px h-2 bg-border/50 dark:bg-white/10" />
            <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-muted/30 dark:bg-white/4 border border-border/40 dark:border-white/8">
              <Clock className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />
              <p className="text-xs text-muted-foreground/80 flex-1">Remaining Balance</p>
              <p className="text-sm font-semibold tabular-nums text-orange-400">
                ₹{formatCurrency(remaining)}
              </p>
            </div>
          </>
        )}

        {payments.length === 0 && (
          <div className="text-center py-6 text-muted-foreground/50">
            <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No payments recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Record Payment View ─────────────────────────────────────────
  const RecordPaymentView = () => (
    <div className="px-5 py-6 space-y-4">
      <div className="glass-panel rounded-xl p-3 flex justify-between items-center">
        <span className="text-xs text-muted-foreground/70">Remaining Balance</span>
        <span className="text-base font-semibold tabular-nums text-orange-400">
          ₹{formatCurrency(remaining)}
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pay-amount" className="saas-label">
          Payment Amount (₹)
        </Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-emerald-400/90">
            ₹
          </span>
          <Input
            ref={paymentAmountRef}
            id="pay-amount"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="h-14 pl-11 pr-4 text-2xl font-semibold tabular-nums rounded-2xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPaymentAmount(String(n))}
              className={cn(
                "min-h-10 px-3 rounded-xl text-xs font-semibold tabular-nums",
                paymentAmount === String(n)
                  ? "bg-emerald-500/25 text-emerald-400 border border-emerald-500/35"
                  : "bg-muted/50 dark:bg-white/6 border border-border/50 dark:border-white/10 text-foreground/85 hover:bg-muted dark:hover:bg-white/10"
              )}
            >
              ₹{n.toLocaleString("en-IN")}
            </button>
          ))}
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setPaymentAmount(String(remaining))}
              className={cn(
                "min-h-10 px-3 rounded-xl text-xs font-semibold tabular-nums",
                paymentAmount === String(remaining)
                  ? "bg-emerald-500/25 text-emerald-400 border border-emerald-500/35"
                  : "bg-muted/50 dark:bg-white/6 border border-border/50 dark:border-white/10 text-foreground/85"
              )}
            >
              Full ₹{formatCurrency(remaining)}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pay-notes" className="saas-label">
          Notes (optional)
        </Label>
        <Input
          id="pay-notes"
          placeholder="Cash, UPI, cheque..."
          value={paymentNotes}
          onChange={(e) => setPaymentNotes(e.target.value)}
          className="h-11 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15"
        />
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {drawerOpen && (
        <motion.div
          key="due-modal"
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
            if (e.target === e.currentTarget) closeDrawer();
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
            {/* ─── Sticky Header ──────────────────────────────────────── */}
            <div
              style={{ position: "sticky", top: 0, zIndex: 50 }}
              className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-black/60 backdrop-blur-xl shrink-0"
            >
              <button
                type="button"
                onClick={handleBack}
                className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center shrink-0 hover:bg-white/12 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-foreground/80" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-gradient leading-tight">
                  {headerTitle}
                </h2>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {headerSubtitle}
                </p>
              </div>
              {/* Ledger shortcut when editing and in details view */}
              {isEditing && view === "details" && (
                <button
                  type="button"
                  onClick={() => setView("ledger")}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-muted/50 dark:bg-white/6 border border-border/50 dark:border-white/10 text-muted-foreground/80 hover:text-foreground/90 transition-colors"
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  Ledger
                  <ChevronRight className="w-3 h-3 opacity-50" />
                </button>
              )}
            </div>

            {/* ─── Scrollable Content ───────────────────────────────────── */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {view === "ledger" ? (
                <LedgerView />
              ) : view === "record_payment" ? (
                <RecordPaymentView />
              ) : (
                // ─── Details / Add Form ────────────────────────────────────
                <div className="px-5 py-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="due-name" className="saas-label">
                      Customer name
                    </Label>
                    <Input
                      ref={nameRef}
                      id="due-name"
                      placeholder="e.g. Ramesh Anna"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-12 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due-amount" className="saas-label">
                      {isEditing ? "Original Amount (₹)" : "Amount (₹)"}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-orange-400/90">
                        ₹
                      </span>
                      <Input
                        ref={amountRef}
                        id="due-amount"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                        className="h-14 pl-11 pr-4 text-2xl font-semibold tabular-nums rounded-2xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_AMOUNTS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setAmount(String(n))}
                          className={cn(
                            "min-h-12 px-3 rounded-xl text-xs font-semibold tabular-nums",
                            amount === String(n)
                              ? "bg-orange-500/25 text-orange-600 dark:text-orange-300 border border-orange-500/35"
                              : "bg-muted/50 dark:bg-white/6 border border-border/50 dark:border-white/10 text-foreground/85 hover:bg-muted dark:hover:bg-white/10"
                          )}
                        >
                          ₹{n.toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due-date" className="saas-label">
                      Due date
                    </Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-12 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15 text-base [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due-phone" className="saas-label">
                      Customer WhatsApp number <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="due-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="98XXXXXXXX"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/[^\d+\s]/g, ""));
                        if (phoneError) setPhoneError("");
                      }}
                      className={cn(
                        "h-12 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15 text-base",
                        phoneError && "border-rose-500/50 focus-visible:ring-rose-500/50"
                      )}
                    />
                    {phoneError && <p className="text-xs text-rose-500">{phoneError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due-notes" className="saas-label">
                      Notes (optional)
                    </Label>
                    <Input
                      id="due-notes"
                      placeholder="Monthly supply, table credit..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="h-11 rounded-xl bg-muted/50 dark:bg-white/5 border-border/50 dark:border-white/15"
                    />
                  </div>

                  {/* Bottom padding */}
                  <div className="h-4" />
                </div>
              )}
            </div>

            {/* ─── Sticky Footer ───────────────────────────────────────── */}
            <div
              style={{ position: "sticky", bottom: 0, zIndex: 50 }}
              className="px-5 py-4 border-t border-white/10 bg-black/60 backdrop-blur-xl shrink-0"
            >
              {view === "ledger" && editingDue?.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    onClick={() => setView("record_payment")}
                    className="flex-1 h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 border border-emerald-500/30 text-white shadow-[0_0_20px_rgb(16,185,129/0.25)]"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Record Payment
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleFullSettle}
                    className="h-12 px-4 rounded-xl text-base font-semibold bg-muted/60 dark:bg-white/8 border border-border/50 dark:border-white/12 text-foreground/80"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Settle All
                  </Button>
                </div>
              )}

              {view === "record_payment" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setView("ledger")}
                    className="flex-1 h-12 rounded-xl border-border/50 dark:border-white/15 bg-muted/50 dark:bg-white/5 text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleRecordPayment}
                    disabled={isRecording}
                    className="flex-[1.4] h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_0_20px_rgb(16,185,129/0.25)]"
                  >
                    {isRecording ? "Saving..." : "Save Payment"}
                  </Button>
                </div>
              )}

              {view === "details" && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={closeDrawer}
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
                      "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600",
                      "shadow-[0_0_28px_rgb(251,146,60/0.35)] border border-border/50 dark:border-white/20 text-white"
                    )}
                  >
                    {isSaving ? "Saving..." : isEditing ? "Update Due" : "Save Due"}
                  </Button>
                </div>
              )}

              {view === "ledger" && editingDue?.status === "paid" && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={closeDrawer}
                  className="w-full h-12 rounded-xl border-border/50 dark:border-white/15 bg-muted/50 dark:bg-white/5 text-base"
                >
                  Close
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
