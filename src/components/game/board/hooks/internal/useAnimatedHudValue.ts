// src/components/game/board/hooks/internal/useAnimatedHudValue.ts - Anima valores numéricos del HUD con transición gradual y retardo opcional en decrementos.
"use client";

import { useEffect, useRef, useState } from "react";

function easeOutCubic(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return 1 - ((1 - clamped) ** 3);
}

/**
 * Devuelve un valor entero animado hacia `targetValue`. Si el valor baja, puede aplicar retardo para sincronía visual.
 */
export function useAnimatedHudValue(targetValue: number, durationMs = 760, decreaseDelayMs = 220): number {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const valueRef = useRef(targetValue);

  useEffect(() => {
    if (valueRef.current === targetValue) return;
    const from = valueRef.current;
    const to = targetValue;
    const delta = to - from;
    const startDelay = delta < 0 ? decreaseDelayMs : 0;
    let frameId = 0;
    let startTimerId = 0;

    const startAnimation = () => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = easeOutCubic((now - startTime) / durationMs);
        const nextValue = Math.round(from + (delta * progress));
        valueRef.current = nextValue;
        setDisplayValue((previous) => (previous === nextValue ? previous : nextValue));
        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }
        valueRef.current = to;
        setDisplayValue(to);
      };
      frameId = window.requestAnimationFrame(tick);
    };

    if (startDelay > 0) {
      startTimerId = window.setTimeout(startAnimation, startDelay);
    } else {
      startAnimation();
    }

    return () => {
      if (startTimerId) window.clearTimeout(startTimerId);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [decreaseDelayMs, durationMs, targetValue]);

  return displayValue;
}
