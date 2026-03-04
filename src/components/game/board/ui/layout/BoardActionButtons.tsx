"use client";

import { History, Pause, Play, Swords, Volume2, VolumeX } from "lucide-react";

interface BoardActionButtonsProps {
  isMuted: boolean;
  isPaused: boolean;
  isHistoryOpen: boolean;
  canSetSelectedEntityToAttack: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onToggleHistory: () => void;
  onSetSelectedEntityToAttack: () => void;
}

export function BoardActionButtons({
  isMuted,
  isPaused,
  isHistoryOpen,
  canSetSelectedEntityToAttack,
  onToggleMute,
  onTogglePause,
  onToggleHistory,
  onSetSelectedEntityToAttack,
}: BoardActionButtonsProps) {
  return (
    <div className="absolute bottom-6 right-6 z-50 flex items-center gap-3">
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
