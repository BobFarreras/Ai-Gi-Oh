// src/components/hub/academy/training/modes/tutorial/internal/create-tutorial-opponent-strategy.ts - Estrategia rival determinista para guiar el flujo del tutorial de combate.
import { IOpponentAttackDecision, IOpponentPlayDecision, IOpponentStrategy } from "@/core/services/opponent/types";
import { GameState } from "@/core/use-cases/GameEngine";

function findHandCardRuntimeId(state: GameState, cardId: string): string | null {
  const card = state.playerB.hand.find((entry) => entry.id === cardId);
  return card?.runtimeId ?? card?.id ?? null;
}

function pickAttacker(state: GameState): string | null {
  const attackables = state.playerB.activeEntities.filter((entity) => entity.mode === "ATTACK" && !entity.hasAttackedThisTurn);
  if (attackables.length === 0) return null;
  return [...attackables].sort((a, b) => (b.card.attack ?? 0) - (a.card.attack ?? 0))[0]?.instanceId ?? null;
}

/**
 * Controla jugadas del rival por turno para que la explicación sea estable y reproducible.
 */
export function createTutorialOpponentStrategy(): IOpponentStrategy {
  return {
    choosePlay(state: GameState): IOpponentPlayDecision | null {
      const turn = state.turn;
      if (turn === 2) {
        const opener = findHandCardRuntimeId(state, "tutorial-opp-assault-alpha");
        if (opener) return { cardId: opener, mode: "ATTACK" };
      }
      if (turn === 4) {
        const setTrap = findHandCardRuntimeId(state, "tutorial-opp-shock-trap");
        if (setTrap) return { cardId: setTrap, mode: "SET" };
      }
      if (turn === 6) {
        const defender = findHandCardRuntimeId(state, "tutorial-opp-guard-gamma");
        if (defender) return { cardId: defender, mode: "DEFENSE" };
      }
      return null;
    },
    chooseAttack(state: GameState): IOpponentAttackDecision | null {
      const attackerInstanceId = pickAttacker(state);
      if (!attackerInstanceId) return null;
      const defender = state.playerA.activeEntities
        .filter((entity) => entity.mode === "ATTACK" || entity.mode === "DEFENSE")
        .sort((a, b) => (a.card.attack ?? 0) - (b.card.attack ?? 0))[0];
      return defender ? { attackerInstanceId, defenderInstanceId: defender.instanceId } : { attackerInstanceId };
    },
  };
}
