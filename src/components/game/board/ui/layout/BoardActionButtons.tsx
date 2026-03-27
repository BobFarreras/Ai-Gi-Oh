// src/components/game/board/ui/layout/BoardActionButtons.tsx - Acciones rápidas del tablero (pausa, audio, historial, auto-turno y atajos de combate).
"use client";

import { Bot, History, Pause, Play, Power, Swords, Volume2, VolumeX } from "lucide-react";

interface BoardActionButtonsProps {
  isMuted: boolean;
  isPaused: boolean;
  isAutoPhaseEnabled: boolean;
  isHistoryOpen: boolean;
  canSetSelectedEntityToAttack: boolean;
  canActivateSelectedExecution: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onToggleAutoPhase: () => void;
  onToggleHistory: () => void;
  onSetSelectedEntityToAttack: () => void;
  onActivateSelectedExecution: () => void;
}

export function BoardActionButtons({
  isMuted,
  isPaused,
  isAutoPhaseEnabled,
  isHistoryOpen,
  canSetSelectedEntityToAttack,
  canActivateSelectedExecution,
  onToggleMute,
  onTogglePause,
  onToggleAutoPhase,
  onToggleHistory,
  onSetSelectedEntityToAttack,
  onActivateSelectedExecution,
}: BoardActionButtonsProps) {
  return (
    <div className="absolute bottom-6 right-6 z-50 flex items-center gap-3">
      {canActivateSelectedExecution && (
        <button
          aria-label="Activar carta en set seleccionada"
          onClick={(event) => {
            event.stopPropagation();
            onActivateSelectedExecution();
          }}
          className="bg-zinc-950/90 border-2 border-fuchsia-400/70 text-fuchsia-200 p-4 rounded-full hover:bg-fuchsia-950 hover:shadow-[0_0_20px_rgba(217,70,239,0.65)] transition-all"
        >
          <Power size={24} />
        </button>
      )}
      {canSetSelectedEntityToAttack && (
        <button
          aria-label="Cambiar entidad seleccionada a ataque"
          onClick={(event) => {
            event.stopPropagation();
            onSetSelectedEntityToAttack();
          }}
          className="bg-zinc-950/90 border-2 border-amber-500/60 text-amber-300 p-4 rounded-full hover:bg-amber-950 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all"
        >
          <Swords size={24} />
        </button>
      )}
      <button
        data-tutorial-id="tutorial-board-pause-button"
        aria-label={isPaused ? "Reanudar partida" : "Pausar partida"}
        onClick={(event) => {
          event.stopPropagation();
          onTogglePause();
        }}
        className="bg-zinc-950/90 border-2 border-emerald-500/60 text-emerald-300 p-4 rounded-full hover:bg-emerald-950 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all"
      >
        {isPaused ? <Play size={24} /> : <Pause size={24} />}
      </button>
      <button
        data-tutorial-id="tutorial-board-auto-button"
        aria-label={isAutoPhaseEnabled ? "Desactivar modo automático de turnos" : "Activar modo automático de turnos"}
        onClick={(event) => {
          event.stopPropagation();
          onToggleAutoPhase();
        }}
        className={`bg-zinc-950/90 border-2 p-4 rounded-full transition-all ${isAutoPhaseEnabled ? "border-violet-400/70 text-violet-200 hover:bg-violet-950 hover:shadow-[0_0_20px_rgba(167,139,250,0.65)]" : "border-zinc-600 text-zinc-400 hover:bg-zinc-900"}`}
      >
        <Bot size={24} />
      </button>
      <button
        data-tutorial-id="tutorial-board-mute-button"
        aria-label={isMuted ? "Activar sonido" : "Silenciar sonido"}
        onClick={(event) => {
          event.stopPropagation();
          onToggleMute();
        }}
        className="bg-zinc-950/90 border-2 border-cyan-500/50 text-cyan-300 p-4 rounded-full hover:bg-cyan-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all"
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>
      <button
        data-tutorial-id="tutorial-board-history-button"
        aria-label={isHistoryOpen ? "Cerrar historial de batalla" : "Abrir historial de batalla"}
        onClick={(event) => {
          event.stopPropagation();
          onToggleHistory();
        }}
        className="bg-zinc-950/90 border-2 border-red-500/50 text-red-500 p-4 rounded-full hover:bg-red-950 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all"
      >
        <History size={24} />
      </button>
    </div>
  );
}
