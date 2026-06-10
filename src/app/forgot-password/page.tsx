"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AnimatedPage } from "@/components/animated-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { DrakvexLogo } from "@/components/ui/drakvex-logo";

export default function ForgotPassword() {
  const router = useRouter();
  const { resetPassword, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link. Please try again.");
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
          <p className="text-muted-foreground text-sm mt-2 font-medium">We'll send you a link to reset your password</p>
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
            {!isSent ? (
              <motion.form 
                key="reset-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleResetPassword} 
                className="space-y-6"
              >
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

                <Button type="submit" className="w-full h-14 text-lg font-medium rounded-xl" disabled={loading || authLoading}>
                  {loading || authLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Send Reset Link"}
                  {!(loading || authLoading) && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>

                <div className="text-center text-sm text-muted-foreground mt-6">
                  Remember your password?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
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
                  <p className="font-medium">Reset link sent!</p>
                  <p className="text-sm opacity-90">Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.</p>
                </div>
                
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-14 text-lg font-medium rounded-xl border-white/10"
                  onClick={() => router.push("/login")}
                >
                  Back to Login
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedPage>
  );
}
