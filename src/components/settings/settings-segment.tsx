"use client";

import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

type SettingsSegmentProps<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export function SettingsSegment<T extends string>({
  value,
  options,
  onChange,
}: SettingsSegmentProps<T>) {
  return (
    <div className="flex p-1 rounded-xl bg-white/6 border border-white/10 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "min-h-9 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
            value === opt.value
              ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgb(var(--glow-primary)/0.3)]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
