// src/services/training/internal/build-arena-opponents-from-presets.ts - Convierte los presets/pools en código al modelo IArenaOpponent (fallback cuando no hay datos de BD).
import { IArenaDeckCardEntry, IArenaOpponent } from "@/core/entities/training/IArenaOpponent";
import { TRAINING_OPPONENT_PRESETS } from "@/services/training/internal/training-opponent-presets";
import { TRAINING_OPPONENT_DECK_POOLS } from "@/services/training/internal/training-opponent-deck-pools";

/** Cada cardId del catálogo en código no lleva overrides (usa el escalado por dificultad). */
function toEntries(cardIds: string[]): IArenaDeckCardEntry[] {
  return cardIds.map((cardId) => ({ cardId, versionTier: null, level: null, xp: null, attackBonus: null, defenseBonus: null }));
}

/** Construye el mapa de oponentes de arena desde las constantes en código, idéntico a la BD sembrada. */
export function buildArenaOpponentsFromPresets(): Record<string, IArenaOpponent> {
  const opponents: Record<string, IArenaOpponent> = {};
  for (const [id, preset] of Object.entries(TRAINING_OPPONENT_PRESETS)) {
    const pools = TRAINING_OPPONENT_DECK_POOLS[id];
    const variants = pools && pools.length > 0
      ? pools.map((variant) => ({ id: variant.id, label: null, deckCards: toEntries(variant.deckCardIds), fusionCards: toEntries(variant.fusionDeckCardIds) }))
      : [{ id: "preset-default", label: null, deckCards: toEntries(preset.deckCardIds), fusionCards: toEntries(preset.fusionDeckCardIds) }];
    opponents[id] = {
      id,
      codeName: preset.codeName,
      displayName: preset.displayName,
      avatarUrl: preset.avatarUrl,
      introUrl: preset.introUrl,
      storyOpponentId: preset.storyOpponentId,
      variants,
    };
  }
  return opponents;
}
