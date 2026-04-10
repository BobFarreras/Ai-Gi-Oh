// src/components/game/board/ui/layout/BoardMobileActionsFab.tsx - Botón flotante móvil que despliega acciones secundarias de batalla.
"use client";

import { useState } from "react";
import { Bot, History, Menu, Pause, Play, Shield, Swords, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardMobileActionsFabProps {
  isMuted: boolean;
  isPaused: boolean;
  isAutoPhaseEnabled: boolean;
  isHistoryOpen: boolean;
  canSetSelectedEntityToAttack: boolean;
  canSetSelectedEntityToDefense: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onToggleAutoPhase: () => void;
  onToggleHistory: () => void;
  onSetSelectedEntityToAttack: () => void;
  onSetSelectedEntityToDefense: () => void;
}

export function BoardMobileActionsFab({
  isMuted,
  isPaused,
  isAutoPhaseEnabled,
  isHistoryOpen,
  canSetSelectedEntityToAttack,
  canSetSelectedEntityToDefense,
  onToggleMute,
  onTogglePause,
  onToggleAutoPhase,
  onToggleHistory,
  onSetSelectedEntityToAttack,
  onSetSelectedEntityToDefense,
}: BoardMobileActionsFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="absolute top-[4.8rem] left-3 z-[260] flex flex-col items-start gap-2 pointer-events-auto">
      <button data-tutorial-id="tutorial-board-actions-menu" aria-label={isOpen ? "Cerrar acciones" : "Abrir acciones"} onClick={() => setIsOpen((v) => !v)} className="rounded-full border border-cyan-400/60 bg-zinc-950/92 p-2.5 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)]">
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
      {isOpen && (
        <div className="rounded-2xl border border-cyan-500/40 bg-zinc-950/92 p-2 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.25)]">
          <div className="flex flex-col gap-1.5">
            {canSetSelectedEntityToAttack && <button aria-label="Cambiar a ataque" onClick={onSetSelectedEntityToAttack} className="rounded-xl border border-amber-500/50 p-2 text-amber-300"><Swords size={18} /></button>}
            {canSetSelectedEntityToDefense && <button aria-label="Cambiar a defensa" onClick={onSetSelectedEntityToDefense} className="rounded-xl border border-sky-500/50 p-2 text-sky-300"><Shield size={18} /></button>}
            <button data-tutorial-id="tutorial-board-pause-button" aria-label={isPaused ? "Reanudar" : "Pausar"} onClick={onTogglePause} className="rounded-xl border border-emerald-500/50 p-2 text-emerald-300">{isPaused ? <Play size={18} /> : <Pause size={18} />}</button>
            <button data-tutorial-id="tutorial-board-auto-button" aria-label={isAutoPhaseEnabled ? "Desactivar automático" : "Activar automático"} onClick={onToggleAutoPhase} className={cn("rounded-xl border p-2", isAutoPhaseEnabled ? "border-violet-400/60 text-violet-200" : "border-zinc-600 text-zinc-300")}><Bot size={18} /></button>
            <button data-tutorial-id="tutorial-board-mute-button" aria-label={isMuted ? "Activar sonido" : "Silenciar"} onClick={onToggleMute} className="rounded-xl border border-cyan-500/50 p-2 text-cyan-300">{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <button data-tutorial-id="tutorial-board-history-button" aria-label={isHistoryOpen ? "Cerrar historial" : "Abrir historial"} onClick={onToggleHistory} className="rounded-xl border border-rose-500/50 p-2 text-rose-300"><History size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
