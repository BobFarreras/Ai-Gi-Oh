// src/components/hub/internal/useProgressiveRenderLimit.ts - Aumenta gradualmente el número de elementos renderizados para reducir coste inicial.
"use client";

import { useEffect, useState } from "react";

interface IUseProgressiveRenderLimitInput {
  total: number;
  initialLimit?: number;
  step?: number;
  intervalMs?: number;
}

export function useProgressiveRenderLimit({
  total,
  initialLimit = 24,
  step = 20,
  intervalMs = 80,
}: IUseProgressiveRenderLimitInput): number {
  const safeInitial = Math.max(1, initialLimit);
  const [limit, setLimit] = useState(() => Math.min(total, safeInitial));

  useEffect(() => {
    const normalizedTotal = Math.max(0, total);
    if (normalizedTotal <= limit) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const tick = () => {
      setLimit((current) => {
        const next = Math.min(normalizedTotal, current + step);
        if (next < normalizedTotal) timeoutId = setTimeout(tick, intervalMs);
        return next;
      });
    };
    timeoutId = setTimeout(tick, intervalMs);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [intervalMs, limit, step, total]);

  return Math.min(limit, Math.max(0, total));
}
