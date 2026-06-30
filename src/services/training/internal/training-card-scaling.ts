// src/services/training/internal/training-card-scaling.ts - Aplica escalado estático de version/level/xp para decks de training según dificultad efectiva.
import { ICard } from "@/core/entities/ICard";
import { IArenaDeckCardEntry } from "@/core/entities/training/IArenaOpponent";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";

export interface ITrainingCardScale {
  versionTier: number;
  level: number;
  xp: number;
}

const TRAINING_SCALE_BY_DIFFICULTY: Record<OpponentDifficulty, ITrainingCardScale> = {
  EASY: { versionTier: 0, level: 0, xp: 0 },
  NORMAL: { versionTier: 0, level: 2, xp: 260 },
  HARD: { versionTier: 1, level: 10, xp: 980 },
  BOSS: { versionTier: 2, level: 20, xp: 2800 },
  MASTER: { versionTier: 3, level: 30, xp: 5600 },
  MYTHIC: { versionTier: 5, level: 30, xp: 9800 },
};

/**
 * Escala todas las copias de cartas al mismo tier para mantener consistencia de entrenamiento.
 */
export function applyTrainingCardScaling(cards: ICard[], difficulty: OpponentDifficulty): ICard[] {
  const scale = TRAINING_SCALE_BY_DIFFICULTY[difficulty];
  return cards.map((card) => ({ ...card, versionTier: scale.versionTier, level: scale.level, xp: scale.xp }));
}

/** Escalado base de un tier por su dificultad (fallback cuando el tier no define escalado propio). */
export function resolveDifficultyScale(difficulty: OpponentDifficulty): ITrainingCardScale {
  return TRAINING_SCALE_BY_DIFFICULTY[difficulty];
}

/**
 * Hidrata entradas de mazo de arena aplicando, por carta, su override (version/level/xp) si existe,
 * o el escalado base del tier/dificultad en su defecto. Permite mazos editables y más fuertes por nivel.
 */
export function applyArenaCardScaling(
  entries: IArenaDeckCardEntry[],
  baseScale: ITrainingCardScale,
  cardCatalog: Map<string, ICard>,
): ICard[] {
  // Omite cartas ausentes del catálogo en vez de romper el duelo (robustez ante datos editados).
  return entries.flatMap((entry) => {
    const card = cardCatalog.get(entry.cardId);
    if (!card) return [];
    return [{
      ...card,
      versionTier: entry.versionTier ?? baseScale.versionTier,
      level: entry.level ?? baseScale.level,
      xp: entry.xp ?? baseScale.xp,
    }];
  });
}
