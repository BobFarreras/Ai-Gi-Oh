// src/components/game/board/ui/overlays/internal/BoardErrorOverlay.tsx - Renderiza mensaje de error global del tablero con cierre manual.
"use client";

import { IBoardUiError } from "../../../hooks/internal/boardError";

interface IBoardErrorOverlayProps {
  error: IBoardUiError | null;
  onClose: () => void;
}

export function BoardErrorOverlay({ error, onClose }: IBoardErrorOverlayProps) {
  if (!error) return null;
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1200] w-[92%] max-w-xl bg-red-950/90 border border-red-500/60 text-red-100 px-5 py-4 rounded-xl shadow-[0_0_35px_rgba(239,68,68,0.4)]">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-xs font-black tracking-wider uppercase text-red-300">{error.code}</p>
          <p className="text-sm font-semibold">{error.message}</p>
        </div>
        <button
          aria-label="Cerrar mensaje de error"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="text-red-200 hover:text-white font-black"
        >
          X
        </button>
      </div>
    </div>
  );
}

