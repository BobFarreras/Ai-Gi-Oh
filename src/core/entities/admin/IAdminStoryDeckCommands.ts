// src/core/entities/admin/IAdminStoryDeckCommands.ts - Comandos de guardado administrativo para mazos de oponentes Story.
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
  slotOverrides: IAdminSaveStoryDuelDeckOverrideCommand[];
}

export interface IAdminSaveStoryDeckCommand {
  deckListId: string;
  cardIds: string[];
  duelConfig: IAdminSaveStoryDuelConfigCommand | null;
}

