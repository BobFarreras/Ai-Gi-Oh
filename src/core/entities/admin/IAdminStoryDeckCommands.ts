// src/core/entities/admin/IAdminStoryDeckCommands.ts - Comandos de guardado administrativo para mazos de oponentes Story.
import { IStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export interface IAdminSaveStoryDuelDeckOverrideCommand {
  slotIndex: number;
  cardId: string;
  versionTier: number;
  level: number;
  xp: number;
}

export interface IAdminSaveStoryDuelConfigCommand {
  duelId: string;
  difficulty: StoryOpponentDifficulty;
  aiProfile: IStoryAiProfile;
  slotOverrides: IAdminSaveStoryDuelDeckOverrideCommand[];
}

export interface IAdminSaveStoryDeckCommand {
  deckListId: string;
  cardIds: string[];
  duelConfig: IAdminSaveStoryDuelConfigCommand | null;
  updateBaseDeck: boolean;
}

