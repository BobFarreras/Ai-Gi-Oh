// src/services/training/resolve-training-opponent-loadout.ts - Resuelve perfil y mazos del oponente de arena (datos de BD o, por defecto, de los presets en código).
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICard } from "@/core/entities/ICard";
import { IArenaDeckVariant, IArenaOpponent } from "@/core/entities/training/IArenaOpponent";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { applyArenaCardScaling } from "@/services/training/internal/training-card-scaling";
import { buildArenaOpponentsFromPresets } from "@/services/training/internal/build-arena-opponents-from-presets";

interface IResolveTrainingOpponentLoadoutInput {
  tier: number;
  aiDifficulty: OpponentDifficulty;
  deckTemplateId: string;
  tierWins: number;
  tierMatches: number;
  /** Catálogo de oponentes (BD); por defecto se construye desde las constantes en código. */
  opponents?: Record<string, IArenaOpponent>;
  /** Catálogo de cartas para hidratar el mazo; por defecto el catálogo en código. */
  cardCatalog?: Map<string, ICard>;
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

const DIFFICULTY_ORDER: OpponentDifficulty[] = ["EASY", "NORMAL", "HARD", "BOSS", "MASTER", "MYTHIC"];
const TRAINING_TIER_ONE_SHOWCASE_ROSTER = [
  "training-tier-1",
  "training-tier-1-alt",
  "training-tier-3",
  "training-tier-4",
  "training-tier-5",
];

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

function resolveRosterTemplateIds(tier: number, deckTemplateId: string, opponents: Record<string, IArenaOpponent>): string[] {
  if (!opponents[deckTemplateId]) {
    throw new ValidationError(`No existe preset base de oponente para '${deckTemplateId}'.`);
  }
  if (tier === 1) {
    const showcaseRoster = TRAINING_TIER_ONE_SHOWCASE_ROSTER.filter((templateId) => Boolean(opponents[templateId]));
    return showcaseRoster.length > 0 ? showcaseRoster : [deckTemplateId];
  }
  const previousTemplates = Array.from({ length: Math.max(0, tier - 1) }, (_, index) => `training-tier-${tier - (index + 1)}`)
    .filter((templateId) => Boolean(opponents[templateId]));
  return [deckTemplateId, ...previousTemplates];
}

function resolveDeckVariant(opponent: IArenaOpponent, tierMatches: number): IArenaDeckVariant {
  if (opponent.variants.length === 0) throw new ValidationError(`El oponente '${opponent.id}' no tiene variantes de mazo.`);
  return opponent.variants[tierMatches % opponent.variants.length];
}

function toVariantLabel(variant: IArenaDeckVariant): string {
  if (variant.label) return variant.label;
  return variant.id
    .split("-")
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

/**
 * Resuelve un oponente de arena con rotación de roster y dificultad adaptativa por rendimiento real.
 * Acepta opcionalmente el catálogo de BD; sin él usa los presets en código (comportamiento idéntico).
 */
export function resolveTrainingOpponentLoadout(input: IResolveTrainingOpponentLoadoutInput): ITrainingOpponentLoadout {
  const opponents = input.opponents ?? buildArenaOpponentsFromPresets();
  const cardCatalog = input.cardCatalog ?? CARD_BY_ID;
  const roster = resolveRosterTemplateIds(input.tier, input.deckTemplateId, opponents);
  const selectedTemplateId = roster[input.tierMatches % roster.length];
  const opponent = opponents[selectedTemplateId];
  if (!opponent) throw new ValidationError(`No existe preset de oponente para '${selectedTemplateId}'.`);
  const selectedVariant = resolveDeckVariant(opponent, input.tierMatches);
  const effectiveDifficulty = resolveAdaptiveDifficulty(input.aiDifficulty, input.tierWins, input.tierMatches);
  return {
    tier: input.tier,
    difficulty: effectiveDifficulty,
    storyOpponentId: opponent.storyOpponentId,
    displayName: opponent.displayName,
    avatarUrl: opponent.avatarUrl,
    introUrl: opponent.introUrl,
    deckVariantId: selectedVariant.id,
    deckVariantLabel: toVariantLabel(selectedVariant),
    deck: applyArenaCardScaling(selectedVariant.deckCards, effectiveDifficulty, cardCatalog),
    fusionDeck: applyArenaCardScaling(selectedVariant.fusionCards, effectiveDifficulty, cardCatalog),
  };
}
