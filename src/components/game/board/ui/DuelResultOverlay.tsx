"use client";

import { AnimatePresence, motion } from "framer-motion";
import { IPlayer } from "@/core/entities/IPlayer";

interface DuelResultOverlayProps {
  winnerPlayerId: string | null;
  playerA: IPlayer;
  playerB: IPlayer;
  onRestart: () => void;
}

function resolveResultText(winnerPlayerId: string | null, playerA: IPlayer, playerB: IPlayer): string {
  if (!winnerPlayerId) return "";
  if (winnerPlayerId === "DRAW") return "EMPATE";
  if (winnerPlayerId === playerA.id) return `VICTORIA DE ${playerA.name}`;
  if (winnerPlayerId === playerB.id) return `DERROTA - GANA ${playerB.name}`;
  return "FIN DEL DUELO";
}

export function DuelResultOverlay({ winnerPlayerId, playerA, playerB, onRestart }: DuelResultOverlayProps) {
  const text = resolveResultText(winnerPlayerId, playerA, playerB);
  const isVisible = Boolean(winnerPlayerId);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[170] bg-black/75 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.75, opacity: 0, rotateX: -20 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="w-[92%] max-w-3xl rounded-3xl border-2 border-cyan-300/60 bg-gradient-to-br from-cyan-950/90 via-zinc-950/95 to-red-950/90 shadow-[0_0_90px_rgba(34,211,238,0.35)] p-10 text-center"
          >
            <p className="text-sm tracking-[0.4em] uppercase text-cyan-300/90 mb-3">Resultado</p>
            <h2 className="text-5xl font-black uppercase text-white tracking-wide drop-shadow-[0_0_24px_rgba(255,255,255,0.3)] mb-3">
              {text}
            </h2>
            <p className="text-zinc-300 text-sm mb-8">Pulsa para reiniciar el duelo.</p>
            <button
              aria-label="Reiniciar duelo"
              onClick={onRestart}
              className="px-6 py-3 rounded-xl border border-cyan-300/60 bg-cyan-500/20 text-cyan-100 font-black uppercase tracking-wider hover:bg-cyan-400/30 transition-colors"
            >
              Nueva partida
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
