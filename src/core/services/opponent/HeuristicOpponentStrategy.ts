import { IPlayer } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentAttackDecision, IOpponentPlayDecision, IOpponentStrategy } from "./types";
import { getDifficultyProfile } from "./difficulty/difficultyProfiles";
import { IOpponentDifficultyProfile, OpponentDifficulty } from "./difficulty/types";
import { chooseBestAttack } from "./attackEvaluator";
import { getFusionRecipe } from "@/core/use-cases/game-engine/fusion/fusion-recipes";

function getPlayers(state: GameState, opponentId: string): { opponent: IPlayer; target: IPlayer } {
  if (state.playerA.id === opponentId) {
    return { opponent: state.playerA, target: state.playerB };
  }

  return { opponent: state.playerB, target: state.playerA };
}

interface IHeuristicOpponentStrategyConfig {
  difficulty?: OpponentDifficulty;
}

function scoreEntity(card: IPlayer["hand"][number], profile: IOpponentDifficultyProfile): number {
  return ((card.attack ?? 0) * 2 + (card.defense ?? 0) - card.cost * 120) * profile.entityTempoBias;
}

function scoreExecution(card: IPlayer["hand"][number], profile: IOpponentDifficultyProfile): number {
  if (!card.effect) {
    return -1000;
  }

  if (card.effect.action === "DAMAGE" && card.effect.target === "OPPONENT") {
    return (card.effect.value * 2 - card.cost * 80) * profile.executionAggroBias;
  }

  if (card.effect.action === "HEAL" && card.effect.target === "PLAYER") {
    return card.effect.value - card.cost * 60;
  }

  return 10 - card.cost * 100;
}

function scoreTrap(card: IPlayer["hand"][number]): number {
  if (!card.effect || card.effect.action !== "DAMAGE") {
    return 40 - card.cost * 80;
  }

  return card.effect.value - card.cost * 60;
}

function scoreFusion(card: IPlayer["hand"][number], profile: IOpponentDifficultyProfile): number {
  const body = (card.attack ?? 0) * 2.1 + (card.defense ?? 0) * 1.2;
  return body * profile.entityTempoBias - card.cost * 90;
}

function chooseFusionMaterials(opponent: IPlayer, fusionCard: IPlayer["hand"][number]): [string, string] | null {
  const recipe = getFusionRecipe(fusionCard);
  if (!recipe || opponent.activeEntities.length < 2) {
    return null;
  }

  const pairs: [typeof opponent.activeEntities[number], typeof opponent.activeEntities[number]][] = [];
  for (let i = 0; i < opponent.activeEntities.length; i += 1) {
    for (let j = i + 1; j < opponent.activeEntities.length; j += 1) {
      pairs.push([opponent.activeEntities[i], opponent.activeEntities[j]]);
    }
  }

  const validPair = pairs.find(([a, b]) => {
    const materials = [a, b];
    if (recipe.requiredArchetypes) {
      const pending = [...recipe.requiredArchetypes];
      for (const material of materials) {
        const archetype = material.card.archetype;
        if (!archetype) {
          continue;
        }
        const index = pending.indexOf(archetype);
        if (index >= 0) pending.splice(index, 1);
      }
      if (pending.length > 0) return false;
    }
    if (recipe.requiredEnergyPerMaterial && materials.some((material) => material.card.cost < recipe.requiredEnergyPerMaterial!)) {
      return false;
    }
    if (recipe.requiredTotalEnergy) {
      const totalCost = materials[0].card.cost + materials[1].card.cost;
      if (totalCost < recipe.requiredTotalEnergy) return false;
    }
    return true;
  });

  return validPair ? [validPair[0].instanceId, validPair[1].instanceId] : null;
}

export class HeuristicOpponentStrategy implements IOpponentStrategy {
  private readonly profile: IOpponentDifficultyProfile;

  public constructor(config?: IHeuristicOpponentStrategyConfig) {
    this.profile = getDifficultyProfile(config?.difficulty ?? "NORMAL");
  }

  public choosePlay(state: GameState, opponentId: string): IOpponentPlayDecision | null {
    const { opponent } = getPlayers(state, opponentId);
    const playableCards = opponent.hand.filter((card) => card.cost <= opponent.currentEnergy);

    if (playableCards.length === 0) {
      return null;
    }

    const scored = playableCards
      .map((card) => {
        const score =
          card.type === "ENTITY"
            ? scoreEntity(card, this.profile)
            : card.type === "FUSION"
              ? scoreFusion(card, this.profile)
              : card.type === "TRAP"
                ? scoreTrap(card)
              : scoreExecution(card, this.profile);
        return { card, score };
      })
      .sort((a, b) => b.score - a.score);

    for (const { card } of scored) {
      if (card.type === "FUSION") {
        const fusionMaterials = chooseFusionMaterials(opponent, card);
        if (!fusionMaterials || state.hasNormalSummonedThisTurn) {
          continue;
        }

        const mode = (card.attack ?? 0) >= (card.defense ?? 0) ? "ATTACK" : "DEFENSE";
        return { cardId: card.id, mode, fusionMaterialInstanceIds: fusionMaterials };
      }

      if (card.type === "ENTITY") {
        if (state.hasNormalSummonedThisTurn || opponent.activeEntities.length >= 3) {
          continue;
        }

        const mode = (card.attack ?? 0) >= (card.defense ?? 0) ? "ATTACK" : "DEFENSE";
        return { cardId: card.id, mode };
      }

      if (card.type === "EXECUTION") {
        if (opponent.activeExecutions.length >= 3) {
          continue;
        }

        if (card.effect?.action === "DAMAGE" && card.effect.target === "OPPONENT") {
          return { cardId: card.id, mode: "ACTIVATE" };
        }

        return { cardId: card.id, mode: "SET" };
      }

      if (card.type === "TRAP") {
        if (opponent.activeExecutions.length >= 3) {
          continue;
        }

        return { cardId: card.id, mode: "SET" };
      }
    }

    return null;
  }

  public chooseAttack(state: GameState, opponentId: string): IOpponentAttackDecision | null {
    const { opponent, target } = getPlayers(state, opponentId);
    const normalizedOpponent: IPlayer = {
      ...opponent,
      activeEntities: opponent.activeEntities.map((entity) =>
        entity.isNewlySummoned ? { ...entity, isNewlySummoned: false } : entity,
      ),
    };

    return chooseBestAttack(normalizedOpponent, target, this.profile);
  }
}
