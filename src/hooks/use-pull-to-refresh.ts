"use client";

import { useCallback, useRef, useState } from "react";
import { isInteractiveTouchTarget } from "@/lib/storage/touch";

export function usePullToRefresh(onRefresh: () => Promise<void>, isRefreshing: boolean) {
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    if (isInteractiveTouchTarget(e.target)) return;
    if (window.scrollY > 8) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    if (!pulling.current || isInteractiveTouchTarget(e.target)) return;
    const dist = Math.max(0, Math.min(80, e.touches[0].clientY - startY.current));
    setPullDistance(dist);
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance > 64 && !isRefreshing) {
      await onRefresh();
    }
    pulling.current = false;
    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  return {
    pullDistance,
    pullHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    pullStyle: {
      transform: pullDistance > 0 ? `translateY(${pullDistance * 0.25}px)` : undefined,
      transition: pulling.current ? "none" : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    },
  };
}
