// src/services/training/resolve-training-opponent-loadout.ts - Resuelve perfil y mazos del oponente de training según tier y template configurado.
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICard } from "@/core/entities/ICard";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { TRAINING_OPPONENT_PRESETS } from "@/services/training/internal/training-opponent-presets";
import { TRAINING_OPPONENT_DECK_POOLS } from "@/services/training/internal/training-opponent-deck-pools";

interface IResolveTrainingOpponentLoadoutInput {
  tier: number;
  aiDifficulty: OpponentDifficulty;
  deckTemplateId: string;
  tierWins: number;
  tierMatches: number;
}

export interface ITrainingOpponentLoadout {
  tier: number;
  difficulty: OpponentDifficulty;
  storyOpponentId: string;
  displayName: string;
  avatarUrl: string;
  introUrl: string;
  deckVariantId: string;
  deckVariantLabel: string;
  deck: ICard[];
  fusionDeck: ICard[];
}

function resolveCard(cardId: string): ICard {
  const card = CARD_BY_ID.get(cardId);
  if (!card) throw new ValidationError(`No existe carta '${cardId}' en el catálogo local para training.`);
  return { ...card };
}
const DIFFICULTY_ORDER: OpponentDifficulty[] = ["EASY", "NORMAL", "HARD", "BOSS"];

function clampDifficultyIndex(index: number): number {
  return Math.max(0, Math.min(DIFFICULTY_ORDER.length - 1, index));
}

function resolveAdaptiveDifficulty(baseDifficulty: OpponentDifficulty, tierWins: number, tierMatches: number): OpponentDifficulty {
  if (tierMatches < 3) return baseDifficulty;
  const rate = tierWins / tierMatches;
  const baseIndex = DIFFICULTY_ORDER.indexOf(baseDifficulty);
  if (rate >= 0.85 && tierMatches >= 6) return DIFFICULTY_ORDER[clampDifficultyIndex(baseIndex + 2)];
  if (rate >= 0.7) return DIFFICULTY_ORDER[clampDifficultyIndex(baseIndex + 1)];
  if (rate <= 0.34) return DIFFICULTY_ORDER[clampDifficultyIndex(baseIndex - 1)];
  return baseDifficulty;
}

function resolveRosterTemplateIds(tier: number, deckTemplateId: string): string[] {
  if (!TRAINING_OPPONENT_PRESETS[deckTemplateId]) {
    throw new ValidationError(`No existe preset base de oponente para '${deckTemplateId}'.`);
  }
  if (tier === 1 && TRAINING_OPPONENT_PRESETS["training-tier-1-alt"]) {
    return [deckTemplateId, "training-tier-1-alt"];
  }
  const previousTemplates = Array.from({ length: Math.max(0, tier - 1) }, (_, index) => `training-tier-${tier - (index + 1)}`)
    .filter((templateId) => Boolean(TRAINING_OPPONENT_PRESETS[templateId]));
  return [deckTemplateId, ...previousTemplates];
}

function resolveDeckVariant(templateId: string, tierMatches: number): { id: string; deckCardIds: string[]; fusionDeckCardIds: string[] } {
  const variants = TRAINING_OPPONENT_DECK_POOLS[templateId];
  if (!variants || variants.length === 0) {
    const preset = TRAINING_OPPONENT_PRESETS[templateId];
    if (!preset) throw new ValidationError(`No existe preset de mazo para '${templateId}'.`);
    return { id: "preset-default", deckCardIds: preset.deckCardIds, fusionDeckCardIds: preset.fusionDeckCardIds };
  }
  return variants[tierMatches % variants.length];
}

function toVariantLabel(variantId: string): string {
  return variantId
    .split("-")
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

/**
 * Resuelve un oponente de training con rotación de roster y dificultad adaptativa por rendimiento real.
 */
export function resolveTrainingOpponentLoadout(input: IResolveTrainingOpponentLoadoutInput): ITrainingOpponentLoadout {
  const roster = resolveRosterTemplateIds(input.tier, input.deckTemplateId);
  const selectedTemplateId = roster[input.tierMatches % roster.length];
  const preset = TRAINING_OPPONENT_PRESETS[selectedTemplateId];
  if (!preset) {
    throw new ValidationError(`No existe preset de oponente para '${selectedTemplateId}'.`);
  }
  const selectedVariant = resolveDeckVariant(selectedTemplateId, input.tierMatches);
  return {
    tier: input.tier,
    difficulty: resolveAdaptiveDifficulty(input.aiDifficulty, input.tierWins, input.tierMatches),
    storyOpponentId: preset.storyOpponentId,
    displayName: preset.displayName,
    avatarUrl: preset.avatarUrl,
    introUrl: preset.introUrl,
    deckVariantId: selectedVariant.id,
    deckVariantLabel: toVariantLabel(selectedVariant.id),
    deck: selectedVariant.deckCardIds.map(resolveCard),
    fusionDeck: selectedVariant.fusionDeckCardIds.map(resolveCard),
  };
}
