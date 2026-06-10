"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, RotateCcw, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

// -----------------------------------------------
// Reset Business Data Modal
// -----------------------------------------------
type ResetProps = { open: boolean; onClose: () => void };

export function ResetDataModal({ open, onClose }: ResetProps) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleReset = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get shop id first
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
      onClose();
      setConfirmText("");
    } catch (err) {
      toast.error("Failed to reset data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel-heavy border border-rose-500/20 rounded-3xl p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-400">Reset Business Data</h2>
              <p className="text-xs text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-sm font-semibold text-rose-400">The following will be permanently deleted:</p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 pl-6 list-disc">
              <li>All Sales records</li>
              <li>All Expense records</li>
              <li>All Due records & payments</li>
              <li>All Customer data</li>
            </ul>
            <p className="text-xs text-muted-foreground pt-1">Your account and shop settings will be preserved.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type <span className="font-mono text-rose-400">RESET</span> to confirm</label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              className="h-12 rounded-[18px] bg-input/40 border-rose-500/30 focus-visible:ring-rose-500 font-mono"
            />
          </div>

          <button
            onClick={handleReset}
            disabled={confirmText !== "RESET" || loading}
            className="w-full h-12 rounded-[18px] bg-rose-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting...</> : <><RotateCcw className="w-4 h-4" />Reset All Business Data</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------
// Delete Account Modal
// -----------------------------------------------
type DeleteProps = { open: boolean; onClose: () => void };

export function DeleteAccountModal({ open, onClose }: DeleteProps) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleDelete = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Get shop
      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // 2. Delete all business data
      if (shop?.id) {
        await Promise.allSettled([
          supabase.from("sales").delete().eq("shop_id", shop.id),
          supabase.from("expenses").delete().eq("shop_id", shop.id),
          supabase.from("customer_dues").delete().eq("shop_id", shop.id),
        ]);
        await supabase.from("shops").delete().eq("id", shop.id);
      }

      // 3. Delete settings & profile
      await Promise.allSettled([
        supabase.from("settings").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("id", user.id),
      ]);

      // 4. Sign out (actual auth.users deletion requires Admin API / Edge Function)
      // The code structure below is ready to call a delete-user edge function when available:
      // await supabase.functions.invoke("delete-user", { body: { user_id: user.id } });

      toast.success("Account data deleted. You have been signed out.");
      await signOut();
      router.push("/login");
    } catch (err) {
      toast.error("Failed to delete account data. Please contact support.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel-heavy border border-rose-500/30 rounded-3xl p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-400">Delete Account</h2>
              <p className="text-xs text-muted-foreground">Permanent & irreversible</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-sm font-semibold text-rose-400">Everything will be permanently deleted:</p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 pl-6 list-disc">
              <li>Your shop & all business data</li>
              <li>All sales, expenses, dues</li>
              <li>Your profile & settings</li>
            </ul>
            <p className="text-xs text-amber-400/80 pt-1 font-medium">⚠ This cannot be recovered.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type <span className="font-mono text-rose-400">DELETE_ACCOUNT</span> to confirm</label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE_ACCOUNT"
              className="h-12 rounded-[18px] bg-input/40 border-rose-500/30 focus-visible:ring-rose-500 font-mono text-sm"
            />
          </div>

          <button
            onClick={handleDelete}
            disabled={confirmText !== "DELETE_ACCOUNT" || loading}
            className="w-full h-12 rounded-[18px] bg-rose-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting Account...</> : <><Trash2 className="w-4 h-4" />Delete My Account</>}
          </button>
        </div>
      </div>
    </div>
  );
}
