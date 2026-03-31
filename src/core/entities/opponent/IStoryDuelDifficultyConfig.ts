// src/core/entities/opponent/IStoryDuelDifficultyConfig.ts - Contratos de configuración por duelo para dificultad IA y overrides estáticos de mazo.
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export interface IStoryDuelAiProfileConfig {
  duelId: string;
  difficulty: StoryOpponentDifficulty;
  aiProfile: Record<string, unknown>;
  isActive: boolean;
}

export interface IStoryDuelDeckOverrideSlot {
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

