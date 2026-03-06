// src/components/game/board/ui/DuelResultOverlay.tsx - Overlay final de duelo con resultado y resumen de experiencia de cartas.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import type { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";
import { DuelResultExperienceCard } from "./internal/DuelResultExperienceCard";

interface DuelResultOverlayProps {
  winnerPlayerId: string | "DRAW" | null;
  playerA: IPlayer;
  playerB: IPlayer;
  battleExperienceSummary: IAppliedCardExperienceResult[];
  battleExperienceCardLookup: Record<string, ICard>;
  isBattleExperiencePending: boolean;
  onRestart: () => void;
}

function resolveResultText(winnerPlayerId: string | "DRAW" | null, playerA: IPlayer, playerB: IPlayer): string {
  if (!winnerPlayerId) return "";
  if (winnerPlayerId === "DRAW") return "EMPATE";
  if (winnerPlayerId === playerA.id) return `VICTORIA DE ${playerA.name}`;
  if (winnerPlayerId === playerB.id) return `DERROTA - GANA ${playerB.name}`;
  return "FIN DEL DUELO";
}

export function DuelResultOverlay({
  winnerPlayerId,
  playerA,
  playerB,
  battleExperienceSummary,
  battleExperienceCardLookup,
  isBattleExperiencePending,
  onRestart,
}: DuelResultOverlayProps) {
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
            className="h-[86vh] w-[96%] max-w-[1400px] rounded-3xl border-2 border-cyan-300/60 bg-gradient-to-br from-cyan-950/90 via-zinc-950/95 to-red-950/90 p-8 text-center shadow-[0_0_90px_rgba(34,211,238,0.35)]"
          >
            <p className="text-sm tracking-[0.4em] uppercase text-cyan-300/90 mb-3">Resultado</p>
            <h2 className="mb-2 text-6xl font-black uppercase tracking-wide text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.3)]">
              {text}
            </h2>
            <p className="mb-5 text-sm text-zinc-300">Pulsa para reiniciar el duelo.</p>
            <div className="mb-6 rounded-2xl border border-cyan-300/30 bg-cyan-950/30 p-4 text-left">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Experiencia de cartas</p>
              {isBattleExperiencePending ? (
                <div className="flex h-[430px] items-center justify-center rounded-xl border border-cyan-500/30 bg-black/25">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.15, repeat: Infinity, ease: "linear" }} className="h-10 w-10 rounded-full border-4 border-cyan-300/30 border-t-cyan-200" />
                  <p className="ml-3 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-100">Calculando EXP del duelo...</p>
                </div>
              ) : battleExperienceSummary.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                  {battleExperienceSummary.map((entry, index) => {
                    const card = battleExperienceCardLookup[entry.cardId];
                    if (!card) return null;
                    return <DuelResultExperienceCard key={`${entry.cardId}-${index}`} entry={entry} card={card} />;
                  })}
                </div>
              ) : (
                <div className="flex h-[430px] items-center justify-center rounded-xl border border-cyan-500/20 bg-black/25">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Sin experiencia de cartas en este duelo.</p>
                </div>
              )}
            </div>
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
