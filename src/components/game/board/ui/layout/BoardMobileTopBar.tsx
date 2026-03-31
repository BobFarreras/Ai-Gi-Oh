// src/components/game/board/ui/layout/BoardMobileTopBar.tsx - Distribución superior móvil con turno/tiempo a la izquierda y mano rival compacta al centro.
"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { OpponentHand } from "@/components/game/board/OpponentHand";
import { cn } from "@/lib/utils";
import { TurnTimer } from "../TurnTimer";

interface BoardMobileTopBarProps {
  hand: ICard[];
  turn: number;
  isActive: boolean;
  isPaused: boolean;
  hasWinner: boolean;
  isTimerEnabled?: boolean;
  phase: string;
  pendingActionType: string | null;
  pendingActionPlayerId: string | null;
  onTimeUp: () => void;
  onWarning: () => void;
}

export function BoardMobileTopBar({
  hand,
  turn,
  isActive,
  isPaused,
  hasWinner,
  isTimerEnabled = true,
  phase,
  pendingActionType,
  pendingActionPlayerId,
  onTimeUp,
  onWarning,
}: BoardMobileTopBarProps) {
  const [viewportWidth, setViewportWidth] = useState(390);
  useEffect(() => {
    const sync = () => setViewportWidth(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const turnWidth = clamp(viewportWidth * 0.33, 118, 146);
  const hudWidth = clamp(viewportWidth * 0.35, 188.8, 262.4);
  const horizontalGap = 6;
  const availableMiddleWidth = Math.max(72, viewportWidth - turnWidth - hudWidth - horizontalGap * 2);
  const spread = hand.length >= 5 ? 14 : 16;
  const compactScale = useMemo(() => {
    const count = Math.max(1, hand.length);
    const solvedScale = (availableMiddleWidth - spread * (count - 1)) / 260;
    return clamp(solvedScale, 0.08, 0.15);
  }, [availableMiddleWidth, hand.length, spread]);
  const phaseLabel = phase.toUpperCase().includes("BATTLE") ? "Combate" : "Invocar";

  return (
    <>
      <div data-tutorial-id="tutorial-board-turn-timer-panel" className="absolute top-0 left-0 z-[245] w-[33vw] min-w-[118px] max-w-[146px] pointer-events-auto">
        <div className={cn("w-full bg-cyan-500/70 pb-[2px] pr-[2px]", "[clip-path:polygon(0_0,100%_0,calc(100%-16px)_100%,0_100%)]")}>
          <div
            className={cn(
              "relative flex h-[58px] w-full items-center bg-zinc-950/90 pl-2.5 pr-4 backdrop-blur-xl",
              "[clip-path:polygon(0_0,100%_0,calc(100%-16px)_100%,0_100%)]",
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.06]" />
            <div className="relative z-10 flex w-full items-center gap-1.5">
              <div className="min-w-[34px]">
                <p className="text-[7px] font-black uppercase tracking-widest text-zinc-400">Turno</p>
                <p className="text-base font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{turn}</p>
              </div>
              <div className="h-7 w-[2px] rotate-12 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="mb-0.5 truncate text-[7px] font-black uppercase tracking-widest text-cyan-300">{phaseLabel}</p>
                <div className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3 text-cyan-300" />
                  {isTimerEnabled ? (
                    <TurnTimer
                      key={`${turn}-${phase}-${pendingActionType ?? "NONE"}-${pendingActionPlayerId ?? "NONE"}`}
                      onTimeUp={onTimeUp}
                      onWarning={onWarning}
                      isActive={isActive && !isPaused && !hasWinner}
                      compact
                    />
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">--</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute top-0 z-[90] h-10 min-w-[80px] max-w-[136px]"
        style={{ left: `${turnWidth + horizontalGap}px`, right: `${hudWidth + horizontalGap}px` }}
      >
        <OpponentHand hand={hand} cardScale={compactScale} className="relative h-full w-full" />
      </div>
    </>
  );
}
