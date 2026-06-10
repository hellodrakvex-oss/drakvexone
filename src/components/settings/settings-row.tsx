"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingsRowProps = {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SettingsRow({ label, description, children, className }: SettingsRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 min-h-[52px] py-2",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground/95">{label}</p>
        {description && <p className="saas-meta mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
