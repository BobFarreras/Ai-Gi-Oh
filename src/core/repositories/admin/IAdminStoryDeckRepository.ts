// src/core/repositories/admin/IAdminStoryDeckRepository.ts - Contrato de persistencia para gestión administrativa de oponentes y mazos Story.
import { ICard } from "@/core/entities/ICard";
import {
  IAdminStoryDeck,
  IAdminStoryDeckSummary,
  IAdminStoryDuelReference,
  IAdminStoryOpponentSummary,
} from "@/core/entities/admin/IAdminStoryDeck";
import { IAdminStoryDuelAiProfile, IAdminStoryDuelDeckOverride } from "@/core/entities/admin/IAdminStoryDuelConfig";
import { IAdminSaveStoryDuelConfigCommand } from "@/core/entities/admin/IAdminStoryDeckCommands";

export interface IAdminStoryDeckRepository {
  listOpponents(): Promise<IAdminStoryOpponentSummary[]>;
  listDeckSummaries(): Promise<IAdminStoryDeckSummary[]>;
  listDuelReferences(): Promise<IAdminStoryDuelReference[]>;
  listDuelAiProfiles(duelIds: string[]): Promise<IAdminStoryDuelAiProfile[]>;
  listDuelDeckOverrides(duelIds: string[]): Promise<IAdminStoryDuelDeckOverride[]>;
  getDeck(deckListId: string): Promise<IAdminStoryDeck | null>;
  saveDeck(deckListId: string, cardIds: string[], duelConfig: IAdminSaveStoryDuelConfigCommand | null, updateBaseDeck: boolean): Promise<void>;
  listAvailableCards(): Promise<ICard[]>;
}

