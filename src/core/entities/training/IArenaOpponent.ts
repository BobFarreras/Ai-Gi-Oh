// src/core/entities/training/IArenaOpponent.ts - Contratos de oponente de arena (perfil + variantes de mazo con overrides por carta), agnósticos de la fuente (BD o código).

/** Carta de un mazo de arena con overrides opcionales; null = usa el escalado por dificultad. */
export interface IArenaDeckCardEntry {
  cardId: string;
  versionTier: number | null;
  level: number | null;
  xp: number | null;
}

/** Variante de mazo que rota dentro de un oponente. */
export interface IArenaDeckVariant {
  id: string;
  label: string | null;
  deckCards: IArenaDeckCardEntry[];
  fusionCards: IArenaDeckCardEntry[];
}

/** Oponente de arena: identidad visual + variantes de mazo. */
export interface IArenaOpponent {
  id: string;
  codeName: string;
  displayName: string;
  avatarUrl: string;
  introUrl: string;
  storyOpponentId: string;
  variants: IArenaDeckVariant[];
}
