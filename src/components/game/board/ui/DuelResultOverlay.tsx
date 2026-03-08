// src/components/game/board/ui/DuelResultOverlay.tsx - Overlay final de duelo con resultado y resumen de experiencia de cartas.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/game/card/Card";
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import type { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";
import { DuelResultExperienceCard } from "./internal/DuelResultExperienceCard";
import { DuelResultRewardsPanel } from "./internal/DuelResultRewardsPanel";
import { DuelResultFireworks } from "./internal/DuelResultFireworks";
import { IDuelResultRewardSummary } from "./internal/duel-result-reward-summary";
import { useDuelResultOverlayState } from "./internal/use-duel-result-overlay-state";

interface DuelResultOverlayProps {
  winnerPlayerId: string | "DRAW" | null;
  playerA: IPlayer;
  playerB: IPlayer;
  battleExperienceSummary: IAppliedCardExperienceResult[];
  battleExperienceCardLookup: Record<string, ICard>;
  isBattleExperiencePending: boolean;
  rewardSummary?: IDuelResultRewardSummary | null;
  resultActionLabel?: string;
  onResultAction?: () => void;
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
  rewardSummary,
  resultActionLabel,
  onResultAction,
  onRestart,
}: DuelResultOverlayProps) {
  const text = resolveResultText(winnerPlayerId, playerA, playerB);
  const isVisible = Boolean(winnerPlayerId);
  const { actionLabel, handleAction, isGiftOpen, setIsGiftOpen, rewardCard, cardDensity, showFireworks } = useDuelResultOverlayState({
    winnerPlayerId,
    playerA,
    battleExperienceCount: battleExperienceSummary.length,
    rewardSummary,
    resultActionLabel,
    onResultAction,
    onRestart,
  });

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
            className="relative flex h-[86vh] w-[96%] max-w-[1440px] flex-col rounded-3xl border-2 border-cyan-300/60 bg-gradient-to-br from-cyan-950/90 via-zinc-950/95 to-red-950/90 p-5 text-center shadow-[0_0_90px_rgba(34,211,238,0.35)] md:p-6"
          >
            <DuelResultFireworks isVisible={showFireworks} />
            <p className="text-sm tracking-[0.4em] uppercase text-cyan-300/90 mb-3">Resultado</p>
            <h2 className="mb-3 text-4xl font-black uppercase tracking-wide text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.3)] md:text-6xl">
              {text}
            </h2>
            <div className="relative z-10 mb-4 grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
              {rewardSummary ? (
                <DuelResultRewardsPanel rewardSummary={rewardSummary} isGiftOpen={isGiftOpen} onToggleGift={() => setIsGiftOpen((prev) => !prev)} />
              ) : (
                <div className="hidden lg:block" />
              )}
              <div className="min-h-0 rounded-2xl border border-cyan-300/30 bg-cyan-950/30 p-3 text-left">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Experiencia de cartas</p>
                {rewardCard && isGiftOpen ? (
                  <div className="mb-2 rounded-xl border border-amber-300/45 bg-black/35 p-2">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/90">Carta obtenida</p>
                    <div className="mx-auto h-[132px] w-[90px] overflow-hidden">
                      <div className="origin-top-left" style={{ transform: "scale(0.345)" }}>
                        <Card card={rewardCard} disableHoverEffects />
                      </div>
                    </div>
                  </div>
                ) : null}
                {isBattleExperiencePending ? (
                  <div className="flex h-[420px] items-center justify-center rounded-xl border border-cyan-500/30 bg-black/25">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.15, repeat: Infinity, ease: "linear" }} className="h-10 w-10 rounded-full border-4 border-cyan-300/30 border-t-cyan-200" />
                    <p className="ml-3 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-100">Calculando EXP del duelo...</p>
                  </div>
                ) : battleExperienceSummary.length > 0 ? (
                  <div className="grid max-h-full min-h-0 grid-cols-[repeat(auto-fit,minmax(168px,1fr))] gap-2 overflow-y-auto pr-1">
                    {battleExperienceSummary.map((entry, index) => {
                      const card = battleExperienceCardLookup[entry.cardId];
                      if (!card) return null;
                      return <DuelResultExperienceCard key={`${entry.cardId}-${index}`} entry={entry} card={card} density={cardDensity} />;
                    })}
                  </div>
                ) : (
                  <div className="flex h-[420px] items-center justify-center rounded-xl border border-cyan-500/20 bg-black/25">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Sin experiencia de cartas en este duelo.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="relative z-10">
              <button
                aria-label={actionLabel}
                onClick={handleAction}
                className="px-6 py-3 rounded-xl border border-cyan-300/60 bg-cyan-500/20 text-cyan-100 font-black uppercase tracking-wider hover:bg-cyan-400/30 transition-colors"
              >
                {actionLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
