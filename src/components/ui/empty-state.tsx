import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { variants } from "@/lib/motion"
import { SalesIllustration, ExpensesIllustration, DashboardIllustration, DuesIllustration } from "./illustrations"

const ILLUSTRATIONS = {
  sales: SalesIllustration,
  expenses: ExpensesIllustration,
  dashboard: DashboardIllustration,
  dues: DuesIllustration,
} as const;

type IllustrationKey = keyof typeof ILLUSTRATIONS;

interface EmptyStateProps {
  icon?: React.ReactNode
  illustration?: IllustrationKey | React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "primary" | "rose" | "orange"
  className?: string
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const variantStyles = {
    default: "bg-white/5 ring-white/10 text-muted-foreground",
    primary: "bg-primary/10 ring-primary/20 text-primary",
    rose: "bg-rose-500/10 ring-rose-500/20 text-rose-400",
    orange: "bg-orange-500/10 ring-orange-500/20 text-orange-400",
  }

  // Resolve illustration: if it's a string key, look up the component
  const resolvedIllustration = (() => {
    if (!illustration) return null;
    if (typeof illustration === "string" && illustration in ILLUSTRATIONS) {
      const Comp = ILLUSTRATIONS[illustration as IllustrationKey];
      return <Comp />;
    }
    return illustration as React.ReactNode;
  })();

  return (
    <motion.div
      variants={variants.empty}
      initial="initial"
      animate="animate"
      className={cn(
        "drakvex-cut-sm relative overflow-hidden border border-border/50 dark:border-white/5 bg-black/10 p-8 flex flex-col items-center justify-center text-center",
        className
      )}
    >
      {/* Ambient background glow */}
      {variant !== "default" && (
        <div
          className={cn(
            "absolute inset-0 opacity-20 blur-3xl pointer-events-none",
            variant === "primary" && "bg-primary",
            variant === "rose" && "bg-rose-500",
            variant === "orange" && "bg-orange-500"
          )}
        />
      )}

      {resolvedIllustration ? (
        <div className={cn(
          "w-28 h-28 mb-6 relative z-10 drop-shadow-[0_0_15px_currentColor]",
          variantStyles[variant].replace('bg-', 'text-').replace('ring-', '')
        )}>
          {resolvedIllustration}
        </div>
      ) : icon ? (
        <div className={cn(
          "w-16 h-16 rounded-[1rem] flex items-center justify-center mb-4 ring-1 relative z-10 shadow-lg",
          variantStyles[variant]
        )}>
          {/* @ts-ignore - Assuming icon is an SVG or Lucide component */}
          {React.cloneElement(icon as React.ReactElement, { className: "w-8 h-8 opacity-80" })}
        </div>
      ) : null}

      <h3 className="text-sm font-semibold text-foreground/90 relative z-10">
        {title}
      </h3>

      {description && (
        <p className="saas-meta mt-1.5 max-w-[240px] relative z-10 opacity-70">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5 relative z-10">
          {action}
        </div>
      )}
    </motion.div>
  )
}
