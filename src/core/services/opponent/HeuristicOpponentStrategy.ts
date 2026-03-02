import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentAttackDecision, IOpponentPlayDecision, IOpponentStrategy } from "./types";

function getPlayers(state: GameState, opponentId: string): { opponent: IPlayer; target: IPlayer } {
  if (state.playerA.id === opponentId) {
    return { opponent: state.playerA, target: state.playerB };
  }

  return { opponent: state.playerB, target: state.playerA };
}

function scoreEntity(card: IPlayer["hand"][number]): number {
  return (card.attack ?? 0) * 2 + (card.defense ?? 0) - card.cost * 120;
}

function scoreExecution(card: IPlayer["hand"][number]): number {
  if (!card.effect) {
    return -1000;
  }

  if (card.effect.action === "DAMAGE" && card.effect.target === "OPPONENT") {
    return card.effect.value * 2 - card.cost * 80;
  }

  if (card.effect.action === "HEAL" && card.effect.target === "PLAYER") {
    return card.effect.value - card.cost * 60;
  }

  return 10 - card.cost * 100;
}

function chooseBestDefender(targetEntities: IBoardEntity[]): IBoardEntity | null {
  if (targetEntities.length === 0) {
    return null;
  }

  return targetEntities.reduce((best, current) => {
    const bestStat = best.mode === "DEFENSE" || best.mode === "SET" ? best.card.defense ?? 0 : best.card.attack ?? 0;
    const currentStat =
      current.mode === "DEFENSE" || current.mode === "SET" ? current.card.defense ?? 0 : current.card.attack ?? 0;

    return currentStat < bestStat ? current : best;
  });
}

export class HeuristicOpponentStrategy implements IOpponentStrategy {
  public choosePlay(state: GameState, opponentId: string): IOpponentPlayDecision | null {
    const { opponent } = getPlayers(state, opponentId);
    const playableCards = opponent.hand.filter((card) => card.cost <= opponent.currentEnergy);

    if (playableCards.length === 0) {
      return null;
    }

    const scored = playableCards
      .map((card) => {
        const score = card.type === "ENTITY" ? scoreEntity(card) : scoreExecution(card);
        return { card, score };
      })
      .sort((a, b) => b.score - a.score);

    for (const { card } of scored) {
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
    }

    return null;
  }

  public chooseAttack(state: GameState, opponentId: string): IOpponentAttackDecision | null {
    const { opponent, target } = getPlayers(state, opponentId);

    const attacker = opponent.activeEntities.find(
      (entity) => entity.mode === "ATTACK" && !entity.hasAttackedThisTurn && !entity.isNewlySummoned,
    );

    if (!attacker) {
      return null;
    }

    const defender = chooseBestDefender(target.activeEntities);

    if (!defender) {
      return { attackerInstanceId: attacker.instanceId };
    }

    return { attackerInstanceId: attacker.instanceId, defenderInstanceId: defender.instanceId };
  }
}
