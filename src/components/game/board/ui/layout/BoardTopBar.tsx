// src/components/game/board/ui/layout/BoardTopBar.tsx - Muestra turno, fase y temporizador principal del combate con estilo HUD.
"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TurnTimer } from "../TurnTimer";

interface BoardTopBarProps {
  turn: number;
  phase: string;
  pendingActionType: string | null;
  pendingActionPlayerId: string | null;
  isPlayerTurn: boolean;
  isPaused: boolean;
  hasWinner: boolean;
  onTimeUp: () => void;
  onWarning: () => void;
}

// Helper de UX: Nombres legibles y colores temáticos según la fase
function getPhaseDisplay(phase: string) {
  const p = phase.toUpperCase();
  if (p.includes("MAIN")) return { label: "Fase de Invocación", color: "text-cyan-400", shadow: "" };
  if (p.includes("BATTLE")) return { label: "Fase de Combate", color: "text-amber-400", shadow: "" };
  if (p.includes("END")) return { label: "Fin de Turno", color: "text-zinc-400", shadow: "" };
  if (p.includes("DRAW") || p.includes("STANDBY")) return { label: "Preparación", color: "text-emerald-400", shadow: "" };
  return { label: phase, color: "text-cyan-400", shadow: "" };
}

export function BoardTopBar({
  turn,
  phase,
  pendingActionType,
  pendingActionPlayerId,
  isPlayerTurn,
  isPaused,
  hasWinner,
  onTimeUp,
  onWarning,
}: BoardTopBarProps) {
  const phaseInfo = getPhaseDisplay(phase);

  return (
    <div className="absolute top-0 left-0 z-50 flex pointer-events-auto filter drop-shadow-[0_5px_15px_rgba(6,182,212,0.35)] w-full max-w-[420px]">
      
      {/* Contenedor Padre (Borde) */}
      <div 
        className={cn(
          "w-full h-[120px] sm:h-[140px] bg-cyan-500/70 pb-[2px] pr-[2px]",
          "[clip-path:polygon(0_0,100%_0,calc(100%-40px)_100%,0_100%)]"
        )}
      >
        {/* Cristal Interior. Añadido pr-16 (Padding Right) para crear la "Safe Zone" frente al corte diagonal */}
        <div 
          className={cn(
            "relative w-full h-full bg-zinc-950/90 backdrop-blur-xl flex items-center pl-6 sm:pl-8 pr-14 sm:pr-16",
            "[clip-path:polygon(0_0,100%_0,calc(100%-40px)_100%,0_100%)]" 
          )}
        >
          {/* Textura Cyberpunk */}
          <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.05]" />

          <div className="relative z-10 flex items-center gap-4 sm:gap-5 w-full">
            
            {/* BLOQUE IZQUIERDO: TURNO (Fijo) */}
            <div className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px]">
              <span className="text-[10px] sm:text-xs text-zinc-400 font-black tracking-widest uppercase mb-[-4px]">
                Turno
              </span>
              <span className="font-black text-white tracking-tighter text-4xl sm:text-5xl uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.9)]">
                {turn}
              </span>
            </div>

            {/* SEPARADOR INCLINADO */}
            <div className="w-[2px] h-14 sm:h-16 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent rotate-12 shadow-[0_0_10px_rgba(6,182,212,0.5)] flex-shrink-0" />

            {/* BLOQUE DERECHO: FASE Y TIEMPO (Expansible y Centrado) */}
            <div className="flex flex-col items-start justify-center flex-1 ml-1 sm:ml-2">
              
              {/* Información de Fase */}
              <span className={cn(
                "text-xs sm:text-sm font-black tracking-widest uppercase mb-1", 
                phaseInfo.color, 
                phaseInfo.shadow
              )}>
                {phaseInfo.label}
              </span>
              
              {/* Reloj Liberado y Gigante */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock 
                  className={cn(
                    "w-6 h-6 sm:w-7 sm:h-7", 
                    isPlayerTurn && !isPaused ? "text-cyan-400 animate-pulse" : "text-zinc-600"
                  )} 
                />
                <div className={cn(
                  "text-3xl sm:text-4xl font-black tracking-widest leading-none drop-shadow-lg",
                  isPlayerTurn && !isPaused ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "text-zinc-500"
                )}>
                  <TurnTimer
                    key={`${turn}-${phase}-${pendingActionType ?? "NONE"}-${pendingActionPlayerId ?? "NONE"}`}
                    onTimeUp={onTimeUp}
                    onWarning={onWarning}
                    isActive={isPlayerTurn && !isPaused && !hasWinner}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
