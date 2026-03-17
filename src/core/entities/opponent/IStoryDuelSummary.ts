// src/core/entities/opponent/IStoryDuelSummary.ts - Resume metadatos de duelos Story para mapa, desbloqueo y navegación.
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export interface IStoryDuelSummary {
  id: string;
  chapter: number;
  duelIndex: number;
  title: string;
  opponentId: string;
  opponentName: string;
  opponentAvatarUrl?: string | null;
  opponentDifficulty: StoryOpponentDifficulty;
  unlockRequirementDuelId: string | null;
  rewardNexus: number;
  rewardPlayerExperience: number;
  isBossDuel: boolean;
  isActive: boolean;
}
