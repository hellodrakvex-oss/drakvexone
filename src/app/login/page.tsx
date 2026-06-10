"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AnimatedPage } from "@/components/animated-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DrakvexLogo } from "@/components/ui/drakvex-logo";

export default function Login() {
  const router = useRouter();
  const { signIn, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
// console.log("[Login] Missing credentials");
      return;
    }

// console.log(`[Login] Attempting to sign in with: ${email}`);
    setLoading(true);
    try {
      await signIn(email, password);
// console.log(`[Login] Sign in successful for: ${email}`);
      router.push("/dashboard");
    } catch (err: any) {
      const errorMsg = err.message || "Failed to sign in. Please try again.";
      setError(errorMsg);
      console.error("[Login] Sign in failed:", {
        email,
        errorName: err?.name,
        errorMessage: err?.message,
      });
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
          
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 w-full backdrop-blur-sm">
            <p className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-3">Built to Manage</p>
            <ul className="text-sm text-foreground/80 flex flex-col gap-1.5 items-center">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/> Track Sales</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"/> Manage Expenses</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> Collect Dues</li>
            </ul>
          </div>
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
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-14 text-lg bg-black/20 border-white/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || authLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </Link>
                </div>
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
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-medium rounded-xl"
              disabled={loading || authLoading}
            >
              {loading || authLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Sign In"
              )}
              {!(loading || authLoading) && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </motion.form>
        </div>
      </div>
    </AnimatedPage>
  );
}
