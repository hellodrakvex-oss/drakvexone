"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Eye, EyeOff, X, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = { open: boolean; onClose: () => void };

export function ChangePasswordModal({ open, onClose }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentRef = useRef<HTMLInputElement>(null);

  // Body scroll lock + hide bottom-nav + focus
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open");
      const t = setTimeout(() => currentRef.current?.focus(), 150);
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
        document.body.classList.remove("modal-open");
      };
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setShowCurrent(false);
    setShowNext(false);
    setShowConfirm(false);
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Could not resolve your account.");
        return;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signInErr) {
        toast.error("Current password is incorrect.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password changed successfully!");
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  // Password strength: 0-4
  const strength = Math.min(
    4,
    Math.floor(next.length / 2)
  );
  const strengthLabel =
    next.length === 0
      ? ""
      : next.length < 6
      ? "Weak"
      : next.length < 10
      ? "Fair"
      : next.length < 14
      ? "Good"
      : "Strong";
  const strengthColor =
    next.length < 6
      ? "text-rose-400"
      : next.length < 10
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Full-viewport backdrop (z-9998, above bottom-nav) ── */}
          <motion.div
            key="pwd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              background: "rgba(0,0,0,0.85)",
            }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* ── Centered dialog ── */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              pointerEvents: "none",
            }}
          >
            <motion.div
              key="pwd-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pwd-modal-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ pointerEvents: "auto", width: "100%", maxWidth: "448px" }}
              className="glass-panel-heavy border border-white/15 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/20 text-primary ring-1 ring-primary/30 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2
                      id="pwd-modal-title"
                      className="text-base font-bold tracking-tight"
                    >
                      Change Password
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Keep your account secure
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

              {/* ── Form body ── */}
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5 space-y-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="pwd-current"
                      className="text-sm font-medium text-foreground/90"
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        ref={currentRef}
                        id="pwd-current"
                        type={showCurrent ? "text" : "password"}
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                        placeholder="Enter current password"
                        autoComplete="current-password"
                        className="h-12 rounded-[18px] bg-input/40 border-border/60 pr-11 focus-visible:ring-primary/40"
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowCurrent((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showCurrent ? "Hide password" : "Show password"}
                      >
                        {showCurrent ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="pwd-new"
                      className="text-sm font-medium text-foreground/90"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="pwd-new"
                        type={showNext ? "text" : "password"}
                        value={next}
                        onChange={(e) => setNext(e.target.value)}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        className="h-12 rounded-[18px] bg-input/40 border-border/60 pr-11 focus-visible:ring-primary/40"
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowNext((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showNext ? "Hide password" : "Show password"}
                      >
                        {showNext ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {/* Strength meter */}
                    {next.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-colors duration-300",
                                i < strength
                                  ? next.length >= 10
                                    ? "bg-emerald-400"
                                    : next.length >= 6
                                    ? "bg-amber-400"
                                    : "bg-rose-400"
                                  : "bg-white/10"
                              )}
                            />
                          ))}
                        </div>
                        <p className={cn("text-[11px] font-medium", strengthColor)}>
                          {strengthLabel}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="pwd-confirm"
                      className="text-sm font-medium text-foreground/90"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="pwd-confirm"
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                        className={cn(
                          "h-12 rounded-[18px] bg-input/40 pr-11 focus-visible:ring-primary/40",
                          confirm.length > 0
                            ? confirm === next
                              ? "border-emerald-500/50 focus-visible:ring-emerald-500/40"
                              : "border-rose-500/50 focus-visible:ring-rose-500/40"
                            : "border-border/60"
                        )}
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {confirm.length > 0 && confirm !== next && (
                      <p className="text-xs text-rose-400">Passwords do not match</p>
                    )}
                    {confirm.length > 0 && confirm === next && (
                      <p className="text-xs text-emerald-400">Passwords match ✓</p>
                    )}
                  </div>
                </div>

                {/* ── Footer actions ── */}
                <div className="flex gap-3 px-6 pb-6 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 h-12 rounded-[18px] border border-border/50 bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !current || !next || !confirm}
                    className={cn(
                      "flex-[1.4] h-12 rounded-[18px] font-semibold text-sm",
                      "flex items-center justify-center gap-2 transition-all",
                      "bg-gradient-to-r from-primary via-violet-500 to-blue-600 text-primary-foreground",
                      "shadow-[0_0_24px_rgb(var(--glow-primary)/0.35)] border border-white/15",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    )}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
