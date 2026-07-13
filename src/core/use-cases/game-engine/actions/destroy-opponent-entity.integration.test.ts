// src/core/use-cases/game-engine/actions/destroy-opponent-entity.integration.test.ts - Verifica #16 Red
// Neuronal Cloud: elegir y destruir una entity rival (a su pila de destruidas) vía acción pendiente.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity, createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";

const destroyCard: ICard = {
  id: "exec-neural-cloud-destroy", name: "Red Neuronal Cloud", description: "", type: "EXECUTION",
  faction: "NEUTRAL", cost: 4, effect: { action: "DESTROY_OPPONENT_ENTITY" },
};
const enemyCard: ICard = { id: "enemy-card", name: "Enemy", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 2, attack: 1500, defense: 800 };

describe("DESTROY_OPPONENT_ENTITY (Red Neuronal Cloud)", () => {
  it("destruye la entity rival elegida y consume la ejecución", () => {
    let state = createTestGameState({
      phase: "MAIN_1",
      activePlayerId: "p1",
      playerA: { hand: [destroyCard] },
      playerB: { activeEntities: [createTestBoardEntity("enemy-inst", enemyCard, "ATTACK")] },
    });
    state = GameEngine.playCard(state, "p1", "exec-neural-cloud-destroy", "ACTIVATE");
    const execInstanceId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", execInstanceId);

    expect(state.pendingTurnAction?.type).toBe("SELECT_OPPONENT_ENTITY_TO_DESTROY");

    state = GameEngine.resolvePendingTurnAction(state, "p1", "enemy-inst");
    expect(state.playerB.activeEntities).toHaveLength(0);
    expect((state.playerB.destroyedPile ?? []).some((card) => card.id === "enemy-card")).toBe(true);
    expect(state.playerA.activeExecutions).toHaveLength(0);
    expect(state.playerA.graveyard.some((card) => card.id === "exec-neural-cloud-destroy")).toBe(true);
    expect(state.pendingTurnAction).toBeNull();
    expect(state.combatLog.some((event) => event.eventType === "CARD_TO_DESTROYED")).toBe(true);
  });

  it("sin entities rivales, deja la ejecución en SET a la espera (no crashea)", () => {
    let state = createTestGameState({ phase: "MAIN_1", activePlayerId: "p1", playerA: { hand: [destroyCard] } });
    state = GameEngine.playCard(state, "p1", "exec-neural-cloud-destroy", "ACTIVATE");
    const execInstanceId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", execInstanceId);
    // Sin objetivo: la ejecución sigue en el tablero (no se pierde) y no hay acción pendiente de destruir.
    expect(state.playerA.activeExecutions).toHaveLength(1);
    expect(state.pendingTurnAction?.type).not.toBe("SELECT_OPPONENT_ENTITY_TO_DESTROY");
  });
});
