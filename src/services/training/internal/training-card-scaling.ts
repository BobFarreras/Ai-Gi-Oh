// src/services/training/internal/training-card-scaling.ts - Escalado estático de version/level/xp para decks de training, con stats de combate recalculados como el jugador.
import { ICard } from "@/core/entities/ICard";
import { IArenaDeckCardEntry } from "@/core/entities/training/IArenaOpponent";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";

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

/** Escalado base de un tier por su dificultad (fallback cuando el tier no define escalado propio). */
export function resolveDifficultyScale(difficulty: OpponentDifficulty): ITrainingCardScale {
  return TRAINING_SCALE_BY_DIFFICULTY[difficulty];
}

/** Progreso sintético para reutilizar el cálculo de bonus de combate del jugador (sin fecha real, determinista). */
function toOpponentProgress(card: ICard, scale: ITrainingCardScale): IPlayerCardProgress {
  return {
    playerId: "arena-opponent",
    cardId: card.id,
    versionTier: scale.versionTier,
    level: scale.level,
    xp: scale.xp,
    masteryPassiveSkillId: card.masteryPassiveSkillId ?? null,
    updatedAtIso: "1970-01-01T00:00:00.000Z",
  };
}

/**
 * Hidrata entradas de mazo de arena aplicando, por carta, su override (version/level/xp) o el escalado
 * base del tier/dificultad, y recalcula stats/coste de combate con las MISMAS reglas que el jugador
 * (`applyCardProgressionToCard` → `resolveCardLevelBonuses`). Así un oponente a nivel 10/20/30 sube
 * ataque/defensa y refleja la pasiva de su versión, igual que las cartas del jugador.
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
    const scale: ITrainingCardScale = {
      versionTier: entry.versionTier ?? baseScale.versionTier,
      level: entry.level ?? baseScale.level,
      xp: entry.xp ?? baseScale.xp,
    };
    // Objetos equipados en la carta del rival: mismo canal de upgrades que el jugador (suma plana ATK/DEF).
    const upgrades = { attackBonus: entry.attackBonus ?? 0, defenseBonus: entry.defenseBonus ?? 0 };
    return [applyCardProgressionToCard(card, toOpponentProgress(card, scale), upgrades)];
  });
}
