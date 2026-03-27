// src/components/hub/academy/training/modes/tutorial/internal/create-tutorial-opponent-strategy.test.ts - Verifica decisiones críticas de la estrategia rival del tutorial de combate.
import { describe, expect, it } from "vitest";
import { createTutorialOpponentStrategy } from "@/components/hub/academy/training/modes/tutorial/internal/create-tutorial-opponent-strategy";
import { createTestBoardEntity, createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import { ICard } from "@/core/entities/ICard";

function createEntityCard(id: string, attack: number): ICard {
  return {
    id,
    name: id,
    description: "Carta de test",
    type: "ENTITY",
    faction: "NEUTRAL",
    cost: 1,
    attack,
    defense: attack - 100,
  };
}

describe("createTutorialOpponentStrategy", () => {
  it("no reutiliza una entidad que ya atacó en el mismo turno", () => {
    const strategy = createTutorialOpponentStrategy();
    const usedAttacker = createTestBoardEntity("used", createEntityCard("used-card", 2600), "ATTACK", { hasAttackedThisTurn: true });
    const readyAttacker = createTestBoardEntity("ready", createEntityCard("ready-card", 1800), "ATTACK");
    const target = createTestBoardEntity("target", createEntityCard("target-card", 1700), "ATTACK");
    const state = createTestGameState({
      playerA: { id: "player-local", activeEntities: [target] },
      playerB: { id: "opponent-local", activeEntities: [usedAttacker, readyAttacker] },
      turn: 6,
      activePlayerId: "opponent-local",
      startingPlayerId: "player-local",
      phase: "BATTLE",
    });

    const decision = strategy.chooseAttack(state, "opponent-local");
    expect(decision?.attackerInstanceId).toBe("ready");
  });

  it("en turno 6 prioriza carta defensiva en posición DEFENSE", () => {
    const strategy = createTutorialOpponentStrategy();
    const defender = { ...createEntityCard("tutorial-opp-guard-gamma", 1900), runtimeId: "defender-runtime", defense: 2400 };
    const state = createTestGameState({
      playerA: { id: "player-local" },
      playerB: { id: "opponent-local", currentEnergy: 6, hand: [defender] },
      turn: 6,
      activePlayerId: "opponent-local",
      startingPlayerId: "player-local",
      phase: "MAIN_1",
    });

    const decision = strategy.choosePlay(state, "opponent-local");
    expect(decision).toEqual({ cardId: "defender-runtime", mode: "DEFENSE" });
  });
});
