// src/core/entities/training/IAdminArena.ts - DTOs y comandos para la edición admin del catálogo de arena (oponentes, variantes, cartas, tiers).

/** Carta de un mazo con overrides (null = escalado por dificultad). */
export interface IAdminArenaCardEntry {
  cardId: string;
  versionTier: number | null;
  level: number | null;
  xp: number | null;
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

/** Carta válida para el selector del editor (restringida al catálogo en código que hidrata arena). */
export interface IAdminArenaValidCard {
  id: string;
  name: string;
}

export interface IAdminArenaCatalog {
  opponents: IAdminArenaOpponent[];
  tiers: IAdminArenaTier[];
  validCards: IAdminArenaValidCard[];
}

export type IUpsertArenaOpponentCommand = Omit<IAdminArenaOpponent, "variants">;
export type IUpsertArenaVariantCommand = IAdminArenaVariant;
export type IUpsertArenaTierCommand = IAdminArenaTier;
