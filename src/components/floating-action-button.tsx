"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { springs } from "@/lib/motion";

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 z-50 md:right-8 md:bottom-8 flex flex-col-reverse items-end gap-3">
      <motion.button
        whileHover={{
          scale: 1.06,
          boxShadow:
            "0 0 32px rgb(var(--glow-primary) / 0.55), 0 0 64px rgb(var(--glow-blue) / 0.25), 0 12px 32px -8px oklch(0 0 0 / 0.5)",
        }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-violet-500 to-blue-600 flex items-center justify-center text-white border border-white/25 shadow-[0_0_24px_rgb(var(--glow-primary)/0.45),0_8px_24px_-6px_oklch(0_0_0/0.5)]"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={springs.press}
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </motion.div>
      </motion.button>
    </div>
  );
}
