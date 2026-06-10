"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { DrakvexLogo } from "@/components/ui/drakvex-logo";
import { durations, easings } from "@/lib/motion";

export default function Splash() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isSkipping, setIsSkipping] = useState(true); // Default true to avoid flash if skipped

  useEffect(() => {
    // Check if we've already launched in this session
    const hasLaunched = sessionStorage.getItem("drakvex-launched");
    
    if (hasLaunched || shouldReduceMotion) {
      router.replace("/dashboard");
      return;
    }

    setIsSkipping(false);
    sessionStorage.setItem("drakvex-launched", "true");

    const timer = setTimeout(() => {
      router.replace("/dashboard");
    }, durations.splash * 1000 + 100); // Wait for splash duration + tiny buffer

    return () => clearTimeout(timer);
  }, [router, shouldReduceMotion]);

  if (isSkipping) return null; // Render nothing if we are redirecting immediately

  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-background text-foreground overflow-hidden relative">
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: durations.splash - 0.2, duration: 0.2, ease: easings.default }}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: easings.dramatic }}
          className="flex flex-col items-center"
        >
          <DrakvexLogo size={80} variant="glow" />
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="mt-6 text-center"
          >
            <h1 className="text-3xl font-black tracking-tight mb-2">
              DRAKVEX <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">ONE</span>
            </h1>
            <p className="text-muted-foreground font-medium tracking-widest text-xs uppercase">
              Built to Manage
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </main>
  );
}
