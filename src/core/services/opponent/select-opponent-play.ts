// src/core/services/opponent/select-opponent-play.ts - Construye decisiones jugables del bot con contexto táctico de tablero y efectos.
import { BattleMode, IPlayer } from "@/core/entities/IPlayer";
import { ICard } from "@/core/entities/ICard";
import { IOpponentDifficultyProfile } from "@/core/services/opponent/difficulty/types";
import { IStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { scoreEntity, scoreExecution, scoreFusion, scoreTrap } from "@/core/services/opponent/heuristic-score";

export interface IPlayableCardDecision {
  card: ICard;
  score: number;
  mode: BattleMode;
}

function resolveEntityMode(card: ICard, target: IPlayer): BattleMode {
  const attack = card.attack ?? 0;
  const defense = card.defense ?? 0;
  const rivalBestAttack = target.activeEntities.reduce((best, entity) => Math.max(best, entity.card.attack ?? 0), 0);
  if (defense > attack && defense >= rivalBestAttack) return "DEFENSE";
  return attack >= defense ? "ATTACK" : "DEFENSE";
}

function hasOwnCardRequiringProgress(opponent: IPlayer, targetCardId: string, level: number, versionTier: number): boolean {
  const allCards = [...opponent.hand, ...opponent.deck, ...opponent.graveyard, ...(opponent.destroyedPile ?? []), ...opponent.activeEntities.map((entity) => entity.card)];
  return allCards.some((card) =>
    card.id === targetCardId && ((card.level ?? 1) < level || (card.versionTier ?? 1) < versionTier));
}

function hasArchetypeEntity(opponent: IPlayer, archetype?: ICard["archetype"]): boolean {
  if (!archetype) return false;
  return opponent.activeEntities.some((entity) => entity.card.archetype === archetype);
}

function canActivateExecutionNow(card: ICard, opponent: IPlayer, target: IPlayer): boolean {
  const effect = card.effect;
  if (!effect) return false;
  if (effect.action === "DAMAGE" || effect.action === "DRAW_CARD" || effect.action === "RESTORE_ENERGY" || effect.action === "DRAIN_OPPONENT_ENERGY") return true;
  if (effect.action === "HEAL") return opponent.healthPoints < opponent.maxHealthPoints;
  if (effect.action === "BOOST_ATTACK_ALLIED_ENTITY") return opponent.activeEntities.length > 0;
  if (effect.action === "BOOST_DEFENSE_BY_ARCHETYPE" || effect.action === "BOOST_ATTACK_BY_ARCHETYPE") return hasArchetypeEntity(opponent, effect.archetype);
  if (effect.action === "SET_DEFENSE_BY_CARD_ID" || effect.action === "BOOST_DEFENSE_BY_CARD_ID") {
    return opponent.activeEntities.some((entity) => entity.card.id === effect.targetCardId);
  }
  if (effect.action === "SET_CARD_DUEL_PROGRESS") {
    return hasOwnCardRequiringProgress(opponent, effect.targetCardId, effect.level, effect.versionTier);
  }
  if (effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND" || effect.action === "RETURN_GRAVEYARD_CARD_TO_FIELD") {
    return opponent.graveyard.some((graveCard) => !effect.cardType || graveCard.type === effect.cardType);
  }
  if (effect.action === "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND") {
    return target.graveyard.some((graveCard) => !effect.cardType || graveCard.type === effect.cardType);
  }
  if (effect.action === "REVEAL_OPPONENT_SET_CARD") {
    const setEntities = effect.zone !== "EXECUTIONS" && target.activeEntities.some((entity) => entity.mode === "SET");
    const setExecutions = effect.zone !== "ENTITIES" && target.activeExecutions.some((entity) => entity.mode === "SET");
    return setEntities || setExecutions;
  }
  if (effect.action === "FUSION_SUMMON") return opponent.activeEntities.length >= 2;
  return false;
}

function resolveExecutionMode(card: ICard, opponent: IPlayer, target: IPlayer): BattleMode {
  return canActivateExecutionNow(card, opponent, target) ? "ACTIVATE" : "SET";
}

function scoreCardWithContext(
  card: ICard,
  opponent: IPlayer,
  target: IPlayer,
  profile: IOpponentDifficultyProfile,
  aiProfile: IStoryAiProfile,
): number {
  const base =
    card.type === "ENTITY"
      ? scoreEntity(card, profile)
      : card.type === "FUSION"
        ? scoreFusion(card, profile)
        : card.type === "TRAP"
          ? scoreTrap(card)
          : scoreExecution(card, profile);
  if (card.type === "TRAP") return aiProfile.style === "control" ? base + 220 : base;
  if (card.type !== "EXECUTION") return base;
  const mode = resolveExecutionMode(card, opponent, target);
  const effect = card.effect;
  const activateBonus = mode === "ACTIVATE" ? 460 : -220;
  if (!effect) return base + activateBonus;
  if (effect.action === "DAMAGE" && effect.target === "OPPONENT") {
    const lethalBonus = effect.value >= target.healthPoints ? 9000 : 0;
    return base + activateBonus + lethalBonus;
  }
  if (effect.action === "HEAL") {
    const lowHpBonus = opponent.healthPoints <= Math.floor(opponent.maxHealthPoints * 0.45) ? 650 : 0;
    return base + activateBonus + lowHpBonus;
  }
  return base + activateBonus;
}

/** Construye y ordena opciones jugables según coste, contexto y estilo IA del duelo. */
export function buildPlayableCardDecisions(input: {
  opponent: IPlayer;
  target: IPlayer;
  profile: IOpponentDifficultyProfile;
  aiProfile: IStoryAiProfile;
}): IPlayableCardDecision[] {
  const playableCards = input.opponent.hand.filter((card) => card.cost <= input.opponent.currentEnergy);
  return playableCards
    .map((card) => ({
      card,
      score: scoreCardWithContext(card, input.opponent, input.target, input.profile, input.aiProfile),
      mode: card.type === "ENTITY" || card.type === "FUSION"
        ? resolveEntityMode(card, input.target)
        : card.type === "EXECUTION"
          ? resolveExecutionMode(card, input.opponent, input.target)
          : "SET",
    }))
    .sort((a, b) => b.score - a.score);
}
