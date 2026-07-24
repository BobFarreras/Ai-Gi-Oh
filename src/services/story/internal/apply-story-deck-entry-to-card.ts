// src/services/story/internal/apply-story-deck-entry-to-card.ts - Hidrata una carta del rival de Story con su
// escalado del admin (versión/nivel/XP + overrides de atributo) usando las MISMAS reglas que el jugador.
import { ICard } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IStoryDeckEntryDefinition } from "@/core/entities/opponent/IStoryDuelDefinition";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";

/** Progreso sintético del rival para reutilizar el cálculo de bonus del jugador (determinista, sin fecha real). */
function toStoryOpponentProgress(card: ICard, entry: IStoryDeckEntryDefinition): IPlayerCardProgress {
  return {
    playerId: "story-opponent",
    cardId: card.id,
    versionTier: entry.versionTier,
    level: entry.level,
    xp: entry.xp,
    masteryPassiveSkillId: card.masteryPassiveSkillId ?? null,
    updatedAtIso: "1970-01-01T00:00:00.000Z",
  };
}

/**
 * Los overrides del admin fijan la BASE de la carta del rival (objetos equipados) y sobre esa base se aplica la
 * curva de NIVEL con las mismas reglas que el jugador y que arena (`applyCardProgressionToCard` →
 * `resolveCardLevelBonuses`). Antes solo se copiaba `level` a la carta sin recalcular nada: un rival de Story a
 * nivel 50 peleaba con los stats y el coste de energía de nivel 0, en todos los actos.
 */
export function applyStoryDeckEntryToCard(card: ICard, entry: IStoryDeckEntryDefinition): ICard {
  const withOverrides: ICard = {
    ...card,
    attack: entry.attackOverride ?? card.attack,
    defense: entry.defenseOverride ?? card.defense,
    effect: (entry.effectOverride as ICard["effect"] | null) ?? card.effect,
  };
  return applyCardProgressionToCard(withOverrides, toStoryOpponentProgress(card, entry));
}
