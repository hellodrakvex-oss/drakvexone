"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";
import { variants } from "@/lib/motion";

export const itemVariants = variants.item;

export function AnimatedPage({ children, className }: { children: ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={variants.page}
      initial="initial"
      animate="animate"
      transition={{ duration: shouldReduceMotion ? 0 : undefined }}
      className={`min-h-[100dvh] flex flex-col min-w-0 w-full ${className || ""}`}
    >
      {children}
    </motion.div>
  );
}
