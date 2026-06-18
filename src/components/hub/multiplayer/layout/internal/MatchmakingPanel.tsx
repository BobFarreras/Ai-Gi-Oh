// src/components/hub/multiplayer/layout/internal/MatchmakingPanel.tsx - Panel de combate aleatorio con estados idle / waiting / matched.
"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";

export type MatchmakingStatus = "idle" | "waiting" | "matched";

interface MatchmakingPanelProps {
  status: MatchmakingStatus;
  hasDeck: boolean;
  onToggleQueue: () => void;
}

/**
 * Panel de combate aleatorio (matchmaking). Los 3 estados tienen apariencia
 * propia: idle = CTA cian, waiting = radar pulsante ámbar, matched = flash
 * verde. Animaciones basadas en transform (scale/opacity), no en box-shadow
 * animado en bucle (regla 5 de performance).
 */
function MatchmakingPanelComponent({ status, hasDeck, onToggleQueue }: MatchmakingPanelProps) {
  const isWaiting = status === "waiting";
  const isMatched = status === "matched";
  const disabled = !hasDeck || isMatched;

  const buttonClass = isWaiting
    ? "border-amber-400/60 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
    : isMatched
      ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
      : "border-cyan-400/50 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25";

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onToggleQueue}
        disabled={disabled}
        aria-label={isWaiting ? "Cancelar búsqueda de rival" : "Buscar rival aleatorio"}
        className={`relative flex items-center justify-center gap-2.5 overflow-hidden rounded-xl px-5 py-3.5 text-sm font-black uppercase tracking-widest transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${buttonClass}`}
      >
        {/* Halo radial decorativo estático (gradiente, no filter blur) */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${isWaiting ? "bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.18),transparent_70%)]" : isMatched ? "bg-[radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.2),transparent_70%)]" : "bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.15),transparent_70%)]"}`}
        />

        <AnimatePresence mode="wait" initial={false}>
          {isWaiting ? (
            <motion.span
              key="waiting"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="relative flex items-center gap-2.5"
            >
              {/* Dots de búsqueda con stagger (transform, GPU-friendly) */}
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-amber-400"
                    animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </span>
              Buscando rival… (cancelar)
            </motion.span>
          ) : isMatched ? (
            <motion.span
              key="matched"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              ¡Rival encontrado!
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="relative flex items-center gap-2.5"
            >
              <Zap size={16} />
              Combate Aleatorio
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {!hasDeck && (
        <p className="text-xs text-amber-300/80">
          Necesitas un mazo activo para buscar rival.
        </p>
      )}
    </div>
  );
}

export const MatchmakingPanel = memo(MatchmakingPanelComponent);
