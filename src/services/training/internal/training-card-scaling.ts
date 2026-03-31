// src/services/training/internal/training-card-scaling.ts - Aplica escalado estático de version/level/xp para decks de training según dificultad efectiva.
import { ICard } from "@/core/entities/ICard";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";

interface ITrainingCardScale {
  versionTier: number;
  level: number;
  xp: number;
}

const TRAINING_SCALE_BY_DIFFICULTY: Record<OpponentDifficulty, ITrainingCardScale> = {
  EASY: { versionTier: 0, level: 0, xp: 0 },
  NORMAL: { versionTier: 0, level: 2, xp: 260 },
  HARD: { versionTier: 1, level: 10, xp: 980 },
  BOSS: { versionTier: 2, level: 200, xp: 2800 },
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
