// src/core/entities/training/IAdminArena.ts - DTOs y comandos para la edición admin del catálogo de arena (oponentes, variantes, cartas, tiers).
import { ICard } from "@/core/entities/ICard";

/** Carta de un mazo con overrides (null = escalado por dificultad). */
export interface IAdminArenaCardEntry {
  cardId: string;
  versionTier: number | null;
  level: number | null;
  xp: number | null;
  /** Bonus de objetos equipados (ATK/DEF); null = 0. */
  attackBonus: number | null;
  defenseBonus: number | null;
}

export interface IAdminArenaVariant {
  id: string;
  opponentId: string;
  label: string | null;
  sortOrder: number;
  isActive: boolean;
  deckCards: IAdminArenaCardEntry[];
  fusionCards: IAdminArenaCardEntry[];
}

export interface IAdminArenaOpponent {
  id: string;
  codeName: string;
  displayName: string;
  avatarUrl: string;
  introUrl: string;
  storyOpponentId: string;
  isActive: boolean;
  sortOrder: number;
  variants: IAdminArenaVariant[];
}

export interface IAdminArenaTier {
  tier: number;
  code: string;
  requiredWinsInPreviousTier: number;
  aiDifficulty: string;
  opponentId: string;
  rewardMultiplier: number;
  isActive: boolean;
  /** Escalado de cartas del rival en este tier (null = usa el de la dificultad). */
  defaultVersionTier: number | null;
  defaultLevel: number | null;
  defaultXp: number | null;
}

export interface IAdminArenaCatalog {
  opponents: IAdminArenaOpponent[];
  tiers: IAdminArenaTier[];
  /** Cartas válidas (catálogo en código que hidrata arena), con datos completos para previsualizar. */
  validCards: ICard[];
}

export type IUpsertArenaOpponentCommand = Omit<IAdminArenaOpponent, "variants">;
export type IUpsertArenaVariantCommand = IAdminArenaVariant;
export type IUpsertArenaTierCommand = IAdminArenaTier;
