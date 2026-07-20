// src/components/game/board/multiplayer/ReactiveTrapDecisionTimer.tsx - Banner + contador del carrusel de
// trampa reactiva en multi (ficha 4). Cubre los dos roles a partir de la pausa del GameState:
//  - DEFENSOR (la pausa le apunta): "Elige tu trampa reactiva" con la cuenta atrás antes de auto-pasar.
//  - ATACANTE (espera la decisión del rival): "Esperando la decisión del rival" con la misma cuenta atrás.
// Es puramente informativo y NO captura clics (pointer-events-none): el carrusel del defensor sigue usable y
// el atacante tiene el tablero bloqueado por el flujo, no por este overlay.
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Hourglass } from "lucide-react";
import { IPendingReactiveTrapDecision } from "@/core/use-cases/game-engine/state/types";
import { REACTIVE_TRAP_DECISION_TIMEOUT_MS } from "./reactive-trap-decision";

interface IReactiveTrapDecisionTimerProps {
  pending: IPendingReactiveTrapDecision | null | undefined;
  localPlayerId: string;
}

const TOTAL_SECONDS = Math.ceil(REACTIVE_TRAP_DECISION_TIMEOUT_MS / 1000);

export function ReactiveTrapDecisionTimer({ pending, localPlayerId }: IReactiveTrapDecisionTimerProps) {
  const isActive = Boolean(pending);
  // La pausa apunta al defensor: si es el jugador local, ÉL decide; si no, el local es el atacante que espera.
  const isDecider = isActive && pending?.defenderPlayerId === localPlayerId;

  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const startRef = useRef(0);

  useEffect(() => {
    if (!isActive) return;
    startRef.current = Date.now();
    setSecondsLeft(TOTAL_SECONDS);
    const intervalId = setInterval(() => {
      const remaining = Math.max(0, REACTIVE_TRAP_DECISION_TIMEOUT_MS - (Date.now() - startRef.current));
      setSecondsLeft(Math.ceil(remaining / 1000));
    }, 250);
    return () => clearInterval(intervalId);
    // Se reinicia cuando aparece una pausa NUEVA (otro ataque). Durante la misma pausa el GameState es estable.
  }, [isActive, pending?.attackerInstanceId, pending?.defenderPlayerId]);

  if (!isActive) return null;

  const isLow = secondsLeft > 0 && secondsLeft <= 5;
  const isResolving = secondsLeft <= 0;
  const title = isResolving ? "Resolviendo…" : isDecider ? "Elige tu trampa reactiva" : "Esperando al rival";
  const subtitle = isDecider
    ? "Activa una trampa o pasa antes de que se agote el tiempo"
    : "El rival está decidiendo qué trampa activar";
  const Icon = isDecider ? ShieldAlert : Hourglass;

  // Paleta según estado: urgencia (rose) > defensor (cyan) > atacante en espera (slate).
  const panelClass = isLow
    ? "border-rose-400/70 bg-gradient-to-br from-rose-950/90 to-slate-950/90 shadow-[0_10px_36px_rgba(244,63,94,0.35)]"
    : isDecider
      ? "border-cyan-400/55 bg-gradient-to-br from-cyan-950/85 to-slate-950/92 shadow-[0_10px_34px_rgba(6,182,212,0.28)]"
      : "border-slate-600/60 bg-gradient-to-br from-slate-900/90 to-slate-950/92 shadow-[0_10px_30px_rgba(0,0,0,0.45)]";
  const accentText = isLow ? "text-rose-200" : isDecider ? "text-cyan-200" : "text-slate-300";
  const ringClass = isLow
    ? "border-rose-400 text-rose-200 animate-pulse"
    : isDecider
      ? "border-cyan-400/80 text-cyan-100"
      : "border-slate-500/80 text-slate-200";

  return (
    // z-[315]: por encima del PlayerHUD móvil (z-[280]) y de los docks de energía/fases (z-[290]-[310]),
    // para que el retrato del oponente no lo tape. Queda por debajo del overlay de carta seleccionada (z-[320]).
    // pointer-events-none: informativo, no bloquea el carrusel del defensor ni el tablero.
    <div className="pointer-events-none absolute inset-x-0 top-[4.25rem] sm:top-16 z-[315] flex justify-center px-3">
      <motion.div
        initial={{ opacity: 0, y: -14, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={`flex max-w-[calc(100vw-1.5rem)] items-center gap-2.5 rounded-2xl border px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-4 sm:py-2.5 ${panelClass}`}
      >
        <span
          aria-hidden
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-slate-950/70 text-base font-bold tabular-nums transition-colors sm:h-10 sm:w-10 ${ringClass}`}
        >
          {secondsLeft > 0 ? secondsLeft : <Icon className="h-4 w-4" />}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className={`flex items-center gap-1.5 font-display text-[9px] font-semibold uppercase tracking-[0.22em] ${accentText}`}>
            <Icon className="h-3 w-3 shrink-0" aria-hidden />
            Trampa reactiva
          </span>
          <span className="truncate text-[13px] font-semibold leading-tight text-white sm:text-sm">{title}</span>
          <span className="hidden truncate text-[11px] leading-tight text-slate-400 sm:block">{subtitle}</span>
        </div>
      </motion.div>
    </div>
  );
}
