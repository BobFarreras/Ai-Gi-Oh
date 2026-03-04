// src/components/game/board/ui/overlays/PauseOverlay.tsx - Overlay de pausa con acción de reanudar para duelos contra oponente automático.
"use client";

import { Play } from "lucide-react";

interface PauseOverlayProps {
  isPaused: boolean;
  onResume: () => void;
}

export function PauseOverlay({ isPaused, onResume }: PauseOverlayProps) {
  if (!isPaused) return null;

  return (
    <div className="absolute inset-0 z-[240] bg-black/55 backdrop-blur-[3px] flex items-center justify-center pointer-events-auto">
      <div className="w-[min(92vw,420px)] rounded-2xl border border-emerald-300/40 bg-zinc-950/88 shadow-[0_0_50px_rgba(16,185,129,0.25)] p-7 text-center">
        <p className="text-sm tracking-[0.22em] uppercase font-black text-emerald-300">Pausa</p>
        <h2 className="mt-2 text-2xl font-black text-zinc-100">Partida detenida</h2>
        <p className="mt-2 text-sm text-zinc-300">Pulsa reanudar para continuar el duelo.</p>
        <button
          aria-label="Reanudar partida"
          onClick={(event) => {
            event.stopPropagation();
            onResume();
          }}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/50 bg-emerald-500/20 px-4 py-3 text-emerald-100 font-black hover:bg-emerald-500/35 transition-colors"
        >
          <Play size={18} />
          Reanudar
        </button>
      </div>
    </div>
  );
}
