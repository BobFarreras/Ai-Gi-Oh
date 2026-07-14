// src/core/use-cases/game-engine/actions/steal-opponent.integration.test.ts - Verifica #12/#13:
// robar una entity (Octocat) y robar una magia/trampa (robo de ejecución) del tablero rival vía selección.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity, createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";

const stealEntityCard: ICard = { id: "exec-octocat-steal-entity", name: "Octocat", description: "", type: "EXECUTION", faction: "NEUTRAL", cost: 4, effect: { action: "STEAL_OPPONENT_ENTITY" } };
const stealExecCard: ICard = { id: "exec-steal-opponent-execution", name: "Robo", description: "", type: "EXECUTION", faction: "NEUTRAL", cost: 4, effect: { action: "STEAL_OPPONENT_EXECUTION" } };
const victimEntity: ICard = { id: "entity-victim", name: "Victim", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 5, attack: 2000, defense: 1500 };
const victimTrap: ICard = { id: "trap-victim", name: "Trap", description: "", type: "TRAP", faction: "NEUTRAL", cost: 2, trigger: "ON_OPPONENT_ATTACK_DECLARED", effect: { action: "NEGATE_ATTACK" } };

describe("STEAL_OPPONENT_ENTITY (#12 Octocat)", () => {
  it("roba la entity rival elegida a tu campo (marcada como usada este turno)", () => {
    let state = createTestGameState({
      phase: "MAIN_1", activePlayerId: "p1",
      playerA: { hand: [stealEntityCard], currentEnergy: 8, maxEnergy: 15 },
      playerB: { activeEntities: [createTestBoardEntity("victim", victimEntity, "ATTACK")] },
    });
    state = GameEngine.playCard(state, "p1", "exec-octocat-steal-entity", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);
    expect(state.pendingTurnAction?.type).toBe("SELECT_OPPONENT_ENTITY_TO_STEAL");

    state = GameEngine.resolvePendingTurnAction(state, "p1", "victim");
    expect(state.playerB.activeEntities).toHaveLength(0);
    const stolen = state.playerA.activeEntities.find((entity) => entity.instanceId === "victim");
    expect(stolen?.card.id).toBe("entity-victim");
    expect(stolen?.hasAttackedThisTurn).toBe(true);
    expect(state.playerA.graveyard.some((card) => card.id === "exec-octocat-steal-entity")).toBe(true);
    expect(state.pendingTurnAction).toBeNull();
  });

  it("sin entities rivales, deja la ejecución en SET a la espera", () => {
    let state = createTestGameState({ phase: "MAIN_1", activePlayerId: "p1", playerA: { hand: [stealEntityCard], currentEnergy: 8, maxEnergy: 15 } });
    state = GameEngine.playCard(state, "p1", "exec-octocat-steal-entity", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);
    expect(state.playerA.activeExecutions).toHaveLength(1);
    expect(state.pendingTurnAction).toBeNull();
  });
});

describe("STEAL_OPPONENT_EXECUTION (#13)", () => {
  it("roba una magia/trampa puesta del rival a tu zona", () => {
    let state = createTestGameState({
      phase: "MAIN_1", activePlayerId: "p1",
      playerA: { hand: [stealExecCard], currentEnergy: 8, maxEnergy: 15 },
      playerB: { activeExecutions: [createTestBoardEntity("victim-trap", victimTrap, "SET")] },
    });
    state = GameEngine.playCard(state, "p1", "exec-steal-opponent-execution", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);
    expect(state.pendingTurnAction?.type).toBe("SELECT_OPPONENT_EXECUTION_TO_STEAL");

    state = GameEngine.resolvePendingTurnAction(state, "p1", "victim-trap");
    expect(state.playerB.activeExecutions).toHaveLength(0);
    expect(state.playerA.activeExecutions.some((entity) => entity.instanceId === "victim-trap")).toBe(true);
    expect(state.playerA.graveyard.some((card) => card.id === "exec-steal-opponent-execution")).toBe(true);
  });
});
