// src/components/game/board/ui/overlays/internal/BoardErrorOverlay.tsx - Renderiza aviso global del tablero (error o bloqueo) con cierre manual.
"use client";

import { Lock } from "lucide-react";
import { IBoardUiError } from "../../../hooks/internal/boardError";

interface IBoardErrorOverlayProps {
  error: IBoardUiError | null;
  onClose: () => void;
}

export function BoardErrorOverlay({ error, onClose }: IBoardErrorOverlayProps) {
  if (!error) return null;
  // Los bloqueos de carta no son fallos: se pintan como aviso ámbar con candado, no como error rojo.
  const isBlocked = error.tone === "blocked";
  return (
    <div
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1200] w-[92%] max-w-xl px-5 py-4 rounded-xl border ${
        isBlocked
          ? "bg-amber-950/90 border-amber-400/60 text-amber-100 shadow-[0_0_35px_rgba(251,191,36,0.35)]"
          : "bg-red-950/90 border-red-500/60 text-red-100 shadow-[0_0_35px_rgba(239,68,68,0.4)]"
      }`}
      role={isBlocked ? "status" : "alert"}
    >
      <div className="flex items-start gap-3">
        {isBlocked ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-300/70 bg-amber-950/80">
            <Lock className="h-4 w-4 text-amber-300" strokeWidth={2.5} />
          </span>
        ) : null}
        <div className="flex-1">
          <p className={`text-xs font-black tracking-wider uppercase ${isBlocked ? "text-amber-300" : "text-red-300"}`}>
            {isBlocked ? "Carta bloqueada" : error.code}
          </p>
          <p className="text-sm font-semibold">{error.message}</p>
        </div>
        <button
          aria-label={isBlocked ? "Cerrar aviso de bloqueo" : "Cerrar mensaje de error"}
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className={`font-black ${isBlocked ? "text-amber-200 hover:text-white" : "text-red-200 hover:text-white"}`}
        >
          X
        </button>
      </div>
    </div>
  );
}

