"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Trash2,
  RotateCcw,
  X,
  Loader2,
  Check,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Shared hook: locks body scroll + hides bottom-nav + ESC key
// ─────────────────────────────────────────────────────────────
function useModalUX(open: boolean, onClose: () => void, focusRef?: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    if (!open) return;

    // Lock scroll
    document.body.style.overflow = "hidden";
    // Hide bottom-nav via utility class (added to globals.css)
    document.body.classList.add("modal-open");

    // Auto-focus
    const t = setTimeout(() => focusRef?.current?.focus(), 150);

    // ESC key
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─────────────────────────────────────────────────────────────
// Shared modal shell
// ─────────────────────────────────────────────────────────────
const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
const PANEL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 16 },
};

interface ModalShellProps {
  id: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Override max-width. Defaults to 560px */
  maxWidth?: number;
}

function ModalShell({ id, open, onClose, children, maxWidth = 560 }: ModalShellProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — z-[9998] sits above bottom-nav (z-50) */}
          <motion.div
            key={`${id}-backdrop`}
            variants={OVERLAY_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          />

          {/* Centering container — z-[9999] */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              pointerEvents: "none",
            }}
          >
            <motion.div
              key={`${id}-panel`}
              role="dialog"
              aria-modal="true"
              variants={PANEL_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth,
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                pointerEvents: "auto",
              }}
              className="glass-panel-heavy border border-white/15 rounded-3xl shadow-2xl overflow-hidden"
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// Reset Business Data Modal
// ─────────────────────────────────────────────────────────────
type ResetProps = { open: boolean; onClose: () => void };

export function ResetDataModal({ open, onClose }: ResetProps) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  useModalUX(open, () => { setConfirmText(""); onClose(); }, inputRef);

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  const handleReset = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (shop?.id) {
        await Promise.allSettled([
          supabase.from("sales").delete().eq("shop_id", shop.id),
          supabase.from("expenses").delete().eq("shop_id", shop.id),
          supabase.from("customer_dues").delete().eq("shop_id", shop.id),
        ]);
      }

      toast.success("Business data has been reset.");
      handleClose();
    } catch (err) {
      toast.error("Failed to reset data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = confirmText === "RESET" && !loading;

  return (
    <ModalShell id="reset-data" open={open} onClose={handleClose}>
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-rose-500/12 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/8 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-400 leading-tight">
              Reset Business Data
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              This action cannot be undone
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div
        className="flex-1 overflow-y-auto px-6 py-5 space-y-5 relative z-10"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Warning card */}
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-sm font-semibold text-rose-400">
              The following will be permanently deleted:
            </p>
          </div>
          <ul className="space-y-1.5 pl-1">
            {["All Sales records", "All Expense records", "All Due records & payments", "All Customer data"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="pt-1 border-t border-rose-500/15 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground/80">Will be preserved:</p>
            {["Your account & login", "Shop settings & profile"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-emerald-400/80">
                <Check className="w-3 h-3 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Confirm input */}
        <div className="space-y-1.5">
          <label htmlFor="reset-confirm" className="text-sm font-medium">
            Type <span className="font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md">RESET</span> to confirm
          </label>
          <Input
            ref={inputRef}
            id="reset-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESET"
            autoComplete="off"
            className="h-12 rounded-[18px] bg-input/40 border-rose-500/30 focus-visible:ring-rose-500/50 font-mono tracking-wider"
          />
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="flex gap-3 px-6 py-4 border-t border-white/8 bg-black/30 shrink-0 relative z-10">
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 h-12 rounded-[18px] border border-border/50 bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={!canSubmit}
          className={cn(
            "flex-[1.4] h-12 rounded-[18px] font-semibold text-sm",
            "flex items-center justify-center gap-2 transition-all",
            "bg-rose-500 hover:bg-rose-600 text-white",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Resetting…</>
          ) : (
            <><RotateCcw className="w-4 h-4" />Reset Data</>
          )}
        </button>
      </div>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Delete Account Modal
// ─────────────────────────────────────────────────────────────
type DeleteProps = { open: boolean; onClose: () => void };

export function DeleteAccountModal({ open, onClose }: DeleteProps) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useModalUX(open, () => { setConfirmText(""); onClose(); }, inputRef);

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  const handleDelete = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { deleteAccountAction } = await import("@/app/actions/user");
      await deleteAccountAction();

      toast.success("Account permanently deleted. You have been signed out.");
      await signOut();
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account data. Please contact support.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = confirmText === "DELETE_ACCOUNT" && !loading;

  return (
    <ModalShell id="delete-account" open={open} onClose={handleClose}>
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/15 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/8 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 ring-1 ring-rose-600/30 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-400 leading-tight">
              Delete Account
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanent &amp; irreversible
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div
        className="flex-1 overflow-y-auto px-6 py-5 space-y-5 relative z-10"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Warning card */}
        <div className="p-4 bg-rose-600/10 border border-rose-600/20 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-sm font-semibold text-rose-400">
              Everything will be permanently deleted:
            </p>
          </div>
          <ul className="space-y-1.5 pl-1">
            {[
              "Your shop & business profile",
              "All Sales records",
              "All Expense records",
              "All Dues & payment history",
              "All Customer data",
              "Your account settings",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600/70 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="pt-2 border-t border-rose-600/15">
            <p className="text-xs text-amber-400/90 font-semibold">
              ⚠ This action cannot be recovered under any circumstances.
            </p>
          </div>
        </div>

        {/* Confirm input */}
        <div className="space-y-1.5">
          <label htmlFor="delete-confirm" className="text-sm font-medium">
            Type{" "}
            <span className="font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md text-xs">
              DELETE_ACCOUNT
            </span>{" "}
            to confirm
          </label>
          <Input
            ref={inputRef}
            id="delete-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE_ACCOUNT"
            autoComplete="off"
            className="h-12 rounded-[18px] bg-input/40 border-rose-600/30 focus-visible:ring-rose-600/50 font-mono text-sm tracking-wider"
          />
          {confirmText.length > 0 && confirmText !== "DELETE_ACCOUNT" && (
            <p className="text-xs text-rose-400">
              Type exactly: DELETE_ACCOUNT
            </p>
          )}
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="flex gap-3 px-6 py-4 border-t border-white/8 bg-black/30 shrink-0 relative z-10">
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 h-12 rounded-[18px] border border-border/50 bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canSubmit}
          className={cn(
            "flex-[1.4] h-12 rounded-[18px] font-semibold text-sm",
            "flex items-center justify-center gap-2 transition-all",
            "bg-rose-600 hover:bg-rose-700 text-white",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</>
          ) : (
            <><Trash2 className="w-4 h-4" />Delete Account</>
          )}
        </button>
      </div>
    </ModalShell>
  );
}
