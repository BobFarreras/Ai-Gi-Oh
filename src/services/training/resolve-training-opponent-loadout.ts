// src/services/training/resolve-training-opponent-loadout.ts - Resuelve perfil y mazos del oponente de training según tier y template configurado.
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICard } from "@/core/entities/ICard";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { TRAINING_OPPONENT_PRESETS } from "@/services/training/internal/training-opponent-presets";

interface IResolveTrainingOpponentLoadoutInput {
  tier: number;
  aiDifficulty: OpponentDifficulty;
  deckTemplateId: string;
}

export interface ITrainingOpponentLoadout {
  tier: number;
  difficulty: OpponentDifficulty;
  displayName: string;
  avatarUrl: string;
  introUrl: string;
  deck: ICard[];
  fusionDeck: ICard[];
}

function resolveCard(cardId: string): ICard {
  const card = CARD_BY_ID.get(cardId);
  if (!card) throw new ValidationError(`No existe carta '${cardId}' en el catálogo local para training.`);
  return { ...card };
}

/**
 * Resuelve un oponente reproducible por tier para que entrenamiento sea balanceable sin tocar UI.
 */
export function resolveTrainingOpponentLoadout(input: IResolveTrainingOpponentLoadoutInput): ITrainingOpponentLoadout {
  const preset = TRAINING_OPPONENT_PRESETS[input.deckTemplateId];
  if (!preset) {
    throw new ValidationError(`No existe preset de oponente para '${input.deckTemplateId}'.`);
  }
  return {
    tier: input.tier,
    difficulty: input.aiDifficulty,
    displayName: preset.displayName,
    avatarUrl: preset.avatarUrl,
    introUrl: preset.introUrl,
    deck: preset.deckCardIds.map(resolveCard),
    fusionDeck: preset.fusionDeckCardIds.map(resolveCard),
  };
}
