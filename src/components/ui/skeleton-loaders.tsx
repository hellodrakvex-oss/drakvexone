import * as React from "react"
import { cn } from "@/lib/utils"

function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={cn(
        "rounded-lg bg-white/5 animate-pulse",
        className
      )}
    />
  )
}


/** Skeleton that mirrors the Business Pulse Command Center */
export function DashboardSkeleton() {
  return (
    <div className="page-content flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Business Pulse block */}
      <div className="drakvex-cut-lg overflow-hidden border border-white/5 bg-white/[0.03]">
        {/* Top: header row */}
        <div className="p-6 pb-5 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Bone className="w-10 h-10 rounded-[14px]" />
            <Bone className="w-28 h-4" />
          </div>
          <Bone className="w-20 h-7 rounded-full" />
        </div>
        {/* Revenue value */}
        <div className="px-6 pb-5 space-y-2">
          <Bone className="w-20 h-3" />
          <Bone className="w-48 h-10 rounded-xl" />
        </div>
        {/* Middle grid */}
        <div className="grid grid-cols-2 border-y border-white/5 bg-black/10 divide-x divide-white/5">
          <div className="p-4 space-y-2.5">
            <Bone className="w-16 h-3" />
            <Bone className="w-24 h-7 rounded-lg" />
          </div>
          <div className="p-4 space-y-2.5">
            <Bone className="w-20 h-3" />
            <Bone className="w-24 h-7 rounded-lg" />
          </div>
        </div>
        {/* Bottom actions */}
        <div className="grid grid-cols-3 p-2 gap-2 bg-black/20">
          {[1, 2, 3].map((i) => (
            <Bone key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="drakvex-cut overflow-hidden border border-white/5 bg-white/[0.03] p-5 space-y-4">
        <div className="space-y-1.5">
          <Bone className="w-32 h-4" />
          <Bone className="w-44 h-3" />
        </div>
        <div className="flex items-end gap-2 h-[140px]">
          {[60, 80, 45, 90, 70, 85, 100].map((h, i) => (
            <Bone key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Two-column grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1, 2].map((i) => (
          <div key={i} className="drakvex-cut border border-white/5 bg-white/[0.03] overflow-hidden">
            <div className="p-5 pb-3 border-b border-white/5 flex justify-between items-center">
              <Bone className="w-32 h-4" />
              <Bone className="w-14 h-3" />
            </div>
            <div className="flex flex-col divide-y divide-white/5">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Bone className="w-8 h-8 rounded-full" />
                    <div className="space-y-1.5">
                      <Bone className="w-28 h-3" />
                      <Bone className="w-16 h-2.5" />
                    </div>
                  </div>
                  <Bone className="w-16 h-4 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton that mirrors the vertical timeline rows */
export function TimelineSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="relative before:absolute before:inset-y-0 before:left-[21px] before:w-[2px] before:bg-gradient-to-b before:from-white/8 before:via-white/4 before:to-transparent space-y-4 pb-4 mt-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 min-w-0">
          {/* Node icon */}
          <div className="w-11 h-11 rounded-full shrink-0 ring-[6px] ring-background bg-background z-10 relative">
            <Bone className="w-full h-full rounded-full" />
          </div>
          {/* Content box */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="drakvex-cut-sm bg-black/10 border border-white/5 p-3.5 space-y-2">
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1.5 flex-1">
                  <Bone className="w-32 h-3.5" />
                  <Bone className="w-20 h-2.5" />
                </div>
                <Bone className="w-16 h-4 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Generic stats-row skeleton (used in Sales & Expenses) */
export function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="drakvex-cut-sm bg-black/10 border border-white/5 p-3 space-y-2">
          <Bone className="w-12 h-2.5" />
          <Bone className="w-16 h-5 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
