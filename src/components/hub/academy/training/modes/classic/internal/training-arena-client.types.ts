// src/components/hub/academy/training/modes/classic/internal/training-arena-client.types.ts - Contrato de datos de Arena clásica.
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { IMatchNarrationPack } from "@/components/game/board/narration/types";
import { ICard } from "@/core/entities/ICard";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";

export interface ITrainingArenaClientProps {
  deck: ICard[];
  fusionDeck: ICard[];
  opponentDeck: ICard[];
  opponentFusionDeck: ICard[];
  playerName: string;
  opponentName: string;
  opponentAvatarUrl: string;
  opponentDifficulty: OpponentDifficulty;
  ladder: Array<{ displayName: string; avatarUrl: string }>;
  ladderWins: number;
  narrationPack: IMatchNarrationPack;
  selectedTier: number;
  completionTicket: string;
  completionBattleId: string;
  playerStartingLpBonus?: number;
  playerMaxEnergyBonus?: number;
  playerTurn1EnergyBonus?: number;
  playerOpeningMulligan?: boolean;
  opponentStartingLpBonus?: number;
  opponentMaxEnergyBonus?: number;
  opponentTurn1EnergyBonus?: number;
  tiers: Array<{
    tier: number;
    code: string;
    aiDifficulty: OpponentDifficulty;
    rewardMultiplier: number;
    requiredWinsInPreviousTier: number;
    winsInPreviousTier: number;
    isUnlocked: boolean;
    missingWins: number;
  }>;
}

export type TrainingRewardSummary = IDuelResultRewardSummary | null;
