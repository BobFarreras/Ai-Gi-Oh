// src/components/game/board/multiplayer/ReactiveTrapDecisionTimer.tsx - Banner + contador del carrusel de
// trampa reactiva en multi (ficha 4). Cubre los dos roles a partir de la pausa del GameState:
//  - DEFENSOR (la pausa le apunta): "Elige tu trampa reactiva" con la cuenta atrás antes de auto-pasar.
//  - ATACANTE (espera la decisión del rival): "Esperando la decisión del rival" con la misma cuenta atrás.
// Es puramente informativo y NO captura clics (pointer-events-none): el carrusel del defensor sigue usable y
// el atacante tiene el tablero bloqueado por el flujo, no por este overlay.
"use client";

import { useEffect, useRef, useState } from "react";
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

  const isLow = secondsLeft <= 5;
  const ringColor = isLow ? "border-rose-400 text-rose-300" : "border-cyan-400/80 text-cyan-200";
  const title = isDecider ? "Elige tu trampa reactiva" : "Esperando la decisión del rival";
  const subtitle = isDecider
    ? "Activa una trampa o pasa antes de que se agote el tiempo"
    : "El rival está eligiendo qué trampa activar";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-[70] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/85 px-4 py-2.5 shadow-lg backdrop-blur-md">
        <span
          aria-hidden
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-slate-900/70 text-base font-bold tabular-nums transition-colors ${ringColor} ${
            isLow ? "animate-pulse" : ""
          }`}
        >
          {secondsLeft > 0 ? secondsLeft : "·"}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-100">
            {secondsLeft > 0 ? title : "Resolviendo…"}
          </span>
          <span className="text-[11px] leading-tight text-slate-400">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}
