"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AnimatedPage } from "@/components/animated-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DrakvexLogo } from "@/components/ui/drakvex-logo";

export default function ResetPassword() {
  const router = useRouter();
  const { updatePassword, isLoading: authLoading } = useAuth();

  const [sessionCreated, setSessionCreated] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Guard against double subscription in React Strict Mode
  const listenerAttached = useRef(false);

  useEffect(() => {
// console.log("[RESET] href", window.location.href);
// console.log("[RESET] search", window.location.search);
// console.log("[RESET] hash", window.location.hash);
const code = new URLSearchParams(window.location.search).get("code");
// console.log("[RESET] code", code);
// console.log("[RESET] mounted");

    // Create a fresh Supabase client after mount so URL params are present
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
      {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: true,
          autoRefreshToken: true,
          persistSession: true,
        },
      }
    );

    // 1️⃣ Check existing session (SSR hydration scenario)
(async () => {
  // Exchange PKCE code for session if present
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
// console.log("[RESET] exchange result", result);
    if (result?.data?.session) {
// console.log("[RESET] session created successfully");
      setSessionCreated(true);
      setError("");
    }
    if (result?.error) {
      console.error("[RESET] exchange error", result.error);
    }
  }

  const { data: { session }, error } = await supabase.auth.getSession();
// console.log("[RESET] getSession result", { session, error });
  if (session) {
    setSessionCreated(true);
    setAuthInitialized(true);
    return;
  }
  setAuthInitialized(true);
})();

    // Ensure we only attach the listener once
    if (listenerAttached.current) return;
    listenerAttached.current = true;
// console.log("[RESET] listener attached");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
// console.log("[RESET] event", event);
// console.log("[RESET] session", session);
      if (event === "PASSWORD_RECOVERY" && session) {
// console.log("[RESET] PASSWORD_RECOVERY detected – session created");
        setSessionCreated(true);
      }
      if (event === "SIGNED_IN" && session) {
        setSessionCreated(true);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCreated) {
      setError("Invalid or expired reset link");
      return;
    }
    if (error) {
      setError(error);
      return;
    }
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
// console.log("[RESET] Password updated");
      setIsSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage className="p-6 justify-center relative overflow-hidden">
      {/* Ambient Brand Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm mx-auto relative z-10">
        <div className="mb-10 text-center flex flex-col items-center">
          <DrakvexLogo size={64} variant="standard" />
          <h1 className="text-3xl font-black tracking-tight mt-6 mb-2">
            DRAKVEX <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">ONE</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium">Enter your new password below</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-destructive text-sm mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="premium-card drakvex-cut p-6">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.form
                key="update-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleUpdatePassword}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-14 text-lg bg-black/20 border-white/10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading || authLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="h-14 text-lg bg-black/20 border-white/10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading || authLoading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-medium rounded-xl"
                  disabled={loading || authLoading}
                >
                  {loading || authLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                  {!(loading || authLoading) && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center space-y-6"
              >
                <div className="bg-primary/10 text-primary p-4 rounded-xl flex flex-col items-center gap-2 border border-primary/20">
                  <CheckCircle2 className="h-8 w-8" />
                  <p className="font-medium">Password Updated!</p>
                  <p className="text-sm opacity-90">
                    Your password has been changed successfully. Redirecting you to login...
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 text-lg font-medium rounded-xl border-white/10"
                  onClick={() => router.push("/login")}
                >
                  Go to Login
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedPage>
  );
}
