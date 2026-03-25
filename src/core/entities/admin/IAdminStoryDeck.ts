// src/core/entities/admin/IAdminStoryDeck.ts - Contratos admin para catálogo de oponentes Story y edición de decks versionados.
import { ICard } from "@/core/entities/ICard";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export interface IAdminStoryOpponentSummary {
  opponentId: string;
  displayName: string;
  avatarUrl: string | null;
  difficulty: StoryOpponentDifficulty;
  deckCount: number;
  duelCount: number;
}

export interface IAdminStoryDeckSummary {
  deckListId: string;
  opponentId: string;
  name: string;
  version: number;
  isActive: boolean;
}

export interface IAdminStoryDuelReference {
  duelId: string;
  chapter: number;
  duelIndex: number;
  title: string;
  deckListId: string;
}

export interface IAdminStoryDeckSlot {
  slotIndex: number;
  cardId: string;
  card: ICard | null;
}

export interface IAdminStoryDeck {
  deckListId: string;
  opponentId: string;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
  slots: IAdminStoryDeckSlot[];
}

export interface IAdminStoryDeckData {
  opponents: IAdminStoryOpponentSummary[];
  decks: IAdminStoryDeckSummary[];
  duels: IAdminStoryDuelReference[];
  deck: IAdminStoryDeck | null;
}

