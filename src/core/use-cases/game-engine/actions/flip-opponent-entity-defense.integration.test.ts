// src/core/use-cases/game-engine/actions/flip-opponent-entity-defense.integration.test.ts - Verifica #4
// Appel: elegir una entity rival y voltearla a modo DEFENSA vía acción pendiente.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity, createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";

const flipCard: ICard = {
  id: "exec-apple-flip-defense", name: "Apple", description: "", type: "EXECUTION",
  faction: "NEUTRAL", cost: 2, effect: { action: "FLIP_OPPONENT_ENTITY_TO_DEFENSE" },
};
const enemyCard: ICard = { id: "enemy-card", name: "Enemy", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 2, attack: 1500, defense: 800 };

describe("FLIP_OPPONENT_ENTITY_TO_DEFENSE (Appel)", () => {
  it("voltea a defensa la entity rival elegida y consume la ejecución", () => {
    let state = createTestGameState({
      phase: "MAIN_1",
      activePlayerId: "p1",
      playerA: { hand: [flipCard] },
      playerB: { activeEntities: [createTestBoardEntity("enemy-inst", enemyCard, "ATTACK")] },
    });
    state = GameEngine.playCard(state, "p1", "exec-apple-flip-defense", "ACTIVATE");
    const execInstanceId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", execInstanceId);

    expect(state.pendingTurnAction?.type).toBe("SELECT_OPPONENT_ENTITY_TO_FLIP_DEFENSE");

    state = GameEngine.resolvePendingTurnAction(state, "p1", "enemy-inst");
    expect(state.playerB.activeEntities[0].mode).toBe("DEFENSE");
    expect(state.playerA.activeExecutions).toHaveLength(0);
    expect(state.playerA.graveyard.some((card) => card.id === "exec-apple-flip-defense")).toBe(true);
    expect(state.pendingTurnAction).toBeNull();
  });

  it("sin entities rivales, deja la ejecución en SET a la espera", () => {
    let state = createTestGameState({ phase: "MAIN_1", activePlayerId: "p1", playerA: { hand: [flipCard] } });
    state = GameEngine.playCard(state, "p1", "exec-apple-flip-defense", "ACTIVATE");
    const execInstanceId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", execInstanceId);
    expect(state.playerA.activeExecutions).toHaveLength(1);
    expect(state.pendingTurnAction?.type).not.toBe("SELECT_OPPONENT_ENTITY_TO_FLIP_DEFENSE");
  });
});
