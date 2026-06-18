// src/components/game/board/ui/internal/duel-result/EloChangeDisplay.tsx - Muestra el cambio ELO animado con contador progresivo y flecha de dirección.
"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";

interface EloChangeDisplayProps {
  delta: number;
  newRating: number;
}

/**
 * Muestra el cambio ELO con animación de contador progresivo.
 * Verde para subida, rojo para bajada, gris para empate.
 */
export function EloChangeDisplay({ delta, newRating }: EloChangeDisplayProps) {
  const [displayDelta, setDisplayDelta] = useState(0);
  const [displayNew, setDisplayNew] = useState(newRating - delta);
  const frameRef = useRef(0);

  useEffect(() => {
    const fromDelta = 0;
    const toDelta = delta;
    const fromNew = newRating - delta;
    const toNew = newRating;
    const durationMs = 800;
    const startedAt = performance.now();

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayDelta(Math.round(fromDelta + (toDelta - fromDelta) * eased));
      setDisplayNew(Math.round(fromNew + (toNew - fromNew) * eased));
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(animate);
      }
    };

    frameRef.current = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameRef.current);
  }, [delta, newRating]);

  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const colorClass = isPositive
    ? "text-emerald-400"
    : isNegative
      ? "text-red-400"
      : "text-zinc-400";
  const bgColor = isPositive
    ? "from-emerald-950/60 to-black/80"
    : isNegative
      ? "from-red-950/60 to-black/80"
      : "from-zinc-800/60 to-black/80";
  const borderColor = isPositive
    ? "border-emerald-500/30"
    : isNegative
      ? "border-red-500/30"
      : "border-zinc-600/30";
  const glowColor = isPositive
    ? "rgba(16,185,129,0.1)"
    : isNegative
      ? "rgba(239,68,68,0.1)"
      : "rgba(113,113,122,0.1)";

  return (
    <div className={`relative overflow-hidden rounded-xl border ${borderColor} bg-gradient-to-br ${bgColor} p-5 shadow-[inset_0_0_20px_${glowColor}]`}>
      <Trophy className={`absolute -right-6 -top-2 w-28 h-28 ${colorClass} opacity-10 -rotate-12 pointer-events-none`} />
      <div className="relative z-10">
        <p className={`text-xs font-black uppercase tracking-[0.2em] ${colorClass} mb-1`}>
          Ranking ELO
        </p>
        <div className="flex items-baseline gap-3">
          <p className={`text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_${glowColor}]`}>
            {isPositive ? "+" : ""}{displayDelta}
          </p>
          <p className="text-lg font-bold text-zinc-400">
            → {displayNew}
          </p>
        </div>
      </div>
    </div>
  );
}
