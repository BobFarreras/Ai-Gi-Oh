// src/components/game/board/ui/internal/duel-result-overlay/types.ts - Tipos compartidos para renderizar el overlay final del duelo.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import type { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";
import { DuelResultCardDensity } from "@/components/game/board/ui/internal/duel-result/duel-result-card-density";

export interface IDuelResultOverlayProps {
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

export interface IDuelResultExperienceContentProps {
  battleExperienceSummary: IAppliedCardExperienceResult[];
  battleExperienceCardLookup: Record<string, ICard>;
  isBattleExperiencePending: boolean;
  density: DuelResultCardDensity;
  emptyLabelClassName: string;
  gridClassName: string;
  wrapperClassName: string;
}

