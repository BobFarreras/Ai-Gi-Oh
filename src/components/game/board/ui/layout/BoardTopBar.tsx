"use client";

import { Clock } from "lucide-react";
import { TurnPhase } from "@/core/use-cases/game-engine/state/types";
import { PhasePanel } from "../PhasePanel";
import { TurnTimer } from "../TurnTimer";

interface BoardTopBarProps {
  turn: number;
  phase: TurnPhase;
  hasNormalSummonedThisTurn: boolean;
  pendingActionType: string | null;
  pendingActionPlayerId: string | null;
  isPlayerTurn: boolean;
  isPaused: boolean;
  onAdvancePhase: () => void;
  onTimeUp: () => void;
  onWarning: () => void;
}

export function BoardTopBar({
  turn,
  phase,
  hasNormalSummonedThisTurn,
  pendingActionType,
  pendingActionPlayerId,
  isPlayerTurn,
  isPaused,
  onAdvancePhase,
  onTimeUp,
  onWarning,
}: BoardTopBarProps) {
  return (
    <div className="absolute top-6 left-6 z-50 flex flex-col items-start pointer-events-auto w-80">
      <div className="w-full bg-zinc-950/90 border-2 border-cyan-500/50 backdrop-blur-xl px-6 py-3 rounded-t-2xl flex items-center justify-between shadow-[0_10px_40px_rgba(6,182,212,0.5)]">
        <div className="flex items-center gap-3">
          <Clock className="text-cyan-400 w-6 h-6 animate-pulse" />
          <span className="font-black text-white tracking-widest text-xl uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
            Turno {turn}
          </span>
        </div>
        <TurnTimer
          key={`${turn}-${phase}-${pendingActionType ?? "NONE"}-${pendingActionPlayerId ?? "NONE"}`}
          onTimeUp={onTimeUp}
          onWarning={onWarning}
          isActive={isPlayerTurn && !isPaused}
        />
      </div>
      <PhasePanel
        phase={phase}
        hasNormalSummonedThisTurn={hasNormalSummonedThisTurn}
        isPlayerTurn={isPlayerTurn}
        onAdvancePhase={onAdvancePhase}
      />
    </div>
  );
}
