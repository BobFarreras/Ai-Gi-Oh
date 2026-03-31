// src/core/entities/admin/IAdminStoryDuelConfig.ts - Contratos admin para editar perfiles de dificultad y overrides estáticos por duelo Story.
import { IStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export interface IAdminStoryDuelAiProfile {
  duelId: string;
  difficulty: StoryOpponentDifficulty;
  aiProfile: IStoryAiProfile;
  isActive: boolean;
}

export interface IAdminStoryDuelDeckOverride {
  duelId: string;
  slotIndex: number;
  cardId: string;
  copies: number;
  versionTier: number;
  level: number;
  xp: number;
  attackOverride: number | null;
  defenseOverride: number | null;
  effectOverride: Record<string, unknown> | null;
  isActive: boolean;
}
