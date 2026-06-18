// src/components/hub/multiplayer/internal/InvitationCountdownBar.tsx - Barra de progreso visual de expiración de invitación con ticking por segundo.
"use client";

import { useEffect, useState } from "react";

interface InvitationCountdownBarProps {
  expiresAt: string;
  /** Duración total en segundos usada como denominador del progreso. */
  totalSeconds: number;
}

/**
 * Barra de cuenta atrás de invitación. Solo repinta el ancho de la barra
 * (transform: scaleX, GPU-friendly) una vez por segundo. El color transiciona
 * de cian (recién llegada) a ámbar (últimos segundos) a rojo (último tramo).
 */
export function InvitationCountdownBar({ expiresAt, totalSeconds }: InvitationCountdownBarProps) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const progress = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const isUrgent = secondsLeft <= 5;
  const isWarning = secondsLeft <= 10 && !isUrgent;

  const barColor = isUrgent
    ? "bg-rose-400"
    : isWarning
      ? "bg-amber-400"
      : "bg-cyan-400";
  const glow = isUrgent
    ? "shadow-[0_0_10px_rgba(248,113,113,0.7)]"
    : isWarning
      ? "shadow-[0_0_10px_rgba(251,191,36,0.6)]"
      : "shadow-[0_0_10px_rgba(34,211,238,0.55)]";

  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${barColor} ${glow} transition-[width] duration-1000 ease-linear`}
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
