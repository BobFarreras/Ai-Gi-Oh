// src/components/game/board/ui/DuelResultOverlay.tsx - Overlay final del duelo que compone vistas mobile/desktop sin mezclar responsabilidades.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DuelResultFireworks } from "@/components/game/board/ui/internal/duel-result/DuelResultFireworks";
import { useDuelResultOverlayState } from "@/components/game/board/ui/internal/duel-result/use-duel-result-overlay-state";
import { IDuelResultOverlayProps } from "@/components/game/board/ui/internal/duel-result-overlay/types";
import { resolveDuelResultText } from "@/components/game/board/ui/internal/duel-result-overlay/resolve-duel-result-text";
import { useDuelResultMobileState } from "@/components/game/board/ui/internal/duel-result-overlay/use-duel-result-mobile";
import { DuelResultMobileContent } from "@/components/game/board/ui/internal/duel-result-overlay/DuelResultMobileContent";
import { DuelResultDesktopContent } from "@/components/game/board/ui/internal/duel-result-overlay/DuelResultDesktopContent";

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
}: IDuelResultOverlayProps) {
  const { isMobile, mobileTab, setMobileTab } = useDuelResultMobileState();
  // Titular principal del resultado; depende del ganador y nombres de jugadores.
  const headerText = resolveDuelResultText(winnerPlayerId, playerA, playerB);
  const isVisible = Boolean(winnerPlayerId);
  // Estado visual concentrado para evitar lógica de control dispersa en el JSX.
  const state = useDuelResultOverlayState({
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
          className="absolute inset-0 z-[170] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="relative flex h-full max-h-[900px] w-full max-w-[1440px] flex-col rounded-2xl border border-cyan-500/50 bg-zinc-950/90 p-6 sm:p-8 shadow-[0_0_100px_rgba(6,182,212,0.2)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
            <DuelResultFireworks isVisible={state.showFireworks} />
            <div className="relative z-10 mb-6 flex flex-row items-center justify-center gap-4 border-b border-cyan-900/50 pb-4">
              <h2 className="max-w-full text-lg sm:text-3xl font-black uppercase tracking-[0.18em] sm:tracking-widest text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] break-words text-center leading-tight">{headerText}</h2>
            </div>
            <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-6 min-h-0 w-full">
              {isMobile ? (
                <DuelResultMobileContent
                  rewardSummary={rewardSummary}
                  mobileTab={mobileTab}
                  onSelectTab={setMobileTab}
                  battleExperienceSummary={battleExperienceSummary}
                  battleExperienceCardLookup={battleExperienceCardLookup}
                  isBattleExperiencePending={isBattleExperiencePending}
                  rewardCard={state.rewardCard}
                  actionLabel={state.actionLabel}
                  onAction={state.handleAction}
                />
              ) : (
                <DuelResultDesktopContent
                  rewardSummary={rewardSummary}
                  isGiftOpen={state.isGiftOpen}
                  onToggleGift={() => state.setIsGiftOpen((previous) => !previous)}
                  rewardCard={state.rewardCard}
                  actionLabel={state.actionLabel}
                  onAction={state.handleAction}
                  isBattleExperiencePending={isBattleExperiencePending}
                  battleExperienceSummary={battleExperienceSummary}
                  battleExperienceCardLookup={battleExperienceCardLookup}
                  cardDensity={state.cardDensity}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

