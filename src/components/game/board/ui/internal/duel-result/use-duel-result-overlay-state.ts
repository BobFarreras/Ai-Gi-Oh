// src/components/game/board/ui/internal/duel-result/use-duel-result-overlay-state.ts - Centraliza estado y control visual del overlay final para mantener el componente de UI limpio.
"use client";

import { useMemo, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { IDuelResultRewardSummary } from "./duel-result-reward-summary";
import { resolveDuelResultCardDensity } from "./duel-result-card-density";

interface IUseDuelResultOverlayStateParams {
  winnerPlayerId: string | "DRAW" | null;
  playerA: IPlayer;
  battleExperienceCount: number;
  rewardSummary?: IDuelResultRewardSummary | null;
  resultActionLabel?: string;
  onResultAction?: () => void;
  onRestart: () => void;
}

export function useDuelResultOverlayState({
  winnerPlayerId,
  playerA,
  battleExperienceCount,
  rewardSummary,
  resultActionLabel,
  onResultAction,
  onRestart,
}: IUseDuelResultOverlayStateParams) {
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const actionLabel = resultActionLabel ?? "Nueva partida";
  const handleAction = onResultAction ?? onRestart;
  const rewardCard: ICard | null = rewardSummary?.rewardCards[0] ?? null;
  const cardDensity = useMemo(() => resolveDuelResultCardDensity(battleExperienceCount), [battleExperienceCount]);
  const isPlayerVictory = winnerPlayerId === playerA.id;

  return {
    isGiftOpen,
    setIsGiftOpen,
    showFireworks: isPlayerVictory,
    rewardCard,
    cardDensity,
    actionLabel,
    handleAction,
  };
}

