// src/core/repositories/admin/IAdminStoryDeckRepository.ts - Contrato de persistencia para gestión administrativa de oponentes y mazos Story.
import { ICard } from "@/core/entities/ICard";
import {
  IAdminStoryDeck,
  IAdminStoryDeckSummary,
  IAdminStoryDuelReference,
  IAdminStoryOpponentSummary,
} from "@/core/entities/admin/IAdminStoryDeck";

export interface IAdminStoryDeckRepository {
  listOpponents(): Promise<IAdminStoryOpponentSummary[]>;
  listDeckSummaries(): Promise<IAdminStoryDeckSummary[]>;
  listDuelReferences(): Promise<IAdminStoryDuelReference[]>;
  getDeck(deckListId: string): Promise<IAdminStoryDeck | null>;
  saveDeck(deckListId: string, cardIds: string[]): Promise<void>;
  listAvailableCards(): Promise<ICard[]>;
}

