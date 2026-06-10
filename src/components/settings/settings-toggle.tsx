"use client";

import { cn } from "@/lib/utils";

type SettingsToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label": string;
};

export function SettingsToggle({
  checked,
  onCheckedChange,
  disabled,
  "aria-label": ariaLabel,
}: SettingsToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative w-12 h-7 rounded-full shrink-0 transition-colors duration-200 border",
        checked
          ? "bg-primary border-primary/50 shadow-[0_0_16px_rgb(var(--glow-primary)/0.35)]"
          : "bg-white/10 border-white/15",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}
