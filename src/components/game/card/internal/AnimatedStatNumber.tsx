// src/components/game/card/internal/AnimatedStatNumber.tsx - Interpola valores numéricos de stats para mostrar subidas/bajadas progresivas en carta.
"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedStatNumberProps {
  value: number;
}

/** Anima un número hacia el nuevo valor para reforzar visualmente cambios de ATK/DEF en combate. */
export function AnimatedStatNumber({ value }: AnimatedStatNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(Math.round(value));
  const previousValueRef = useRef<number>(Math.round(value));

  useEffect(() => {
    const from = previousValueRef.current;
    const to = Math.round(value);
    if (from === to) return;

    let frameId = 0;
    const durationMs = 420;
    const startedAt = performance.now();
    const delta = to - from;

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(from + delta * eased);
      setDisplayValue(nextValue);
      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
        return;
      }
      previousValueRef.current = to;
      setDisplayValue(to);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return <>{displayValue}</>;
}

