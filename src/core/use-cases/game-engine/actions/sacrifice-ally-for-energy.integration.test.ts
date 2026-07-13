// src/core/use-cases/game-engine/actions/sacrifice-ally-for-energy.integration.test.ts - Verifica #14
// Cubo Metálico: sacrificar una entity propia y ganar energía igual a su coste, vía acción pendiente.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity, createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";

const sacrificeCard: ICard = {
  id: "exec-metal-cube-sacrifice", name: "Cubo Metálico", description: "", type: "EXECUTION",
  faction: "NEUTRAL", cost: 2, effect: { action: "SACRIFICE_ALLY_ENTITY_FOR_ENERGY" },
};
const allyCard: ICard = { id: "entity-ally", name: "Ally", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 4, attack: 1500, defense: 1100 };

describe("SACRIFICE_ALLY_ENTITY_FOR_ENERGY (Cubo Metálico)", () => {
  it("destruye la entity propia elegida y suma su coste a la energía", () => {
    let state = createTestGameState({
      phase: "MAIN_1",
      activePlayerId: "p1",
      playerA: { hand: [sacrificeCard], currentEnergy: 3, maxEnergy: 15, activeEntities: [createTestBoardEntity("ally-inst", allyCard, "ATTACK")] },
    });
    state = GameEngine.playCard(state, "p1", "exec-metal-cube-sacrifice", "ACTIVATE"); // energía 3 - 2 = 1
    const execInstanceId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", execInstanceId);

    expect(state.pendingTurnAction?.type).toBe("SELECT_OWN_ENTITY_TO_SACRIFICE");

    state = GameEngine.resolvePendingTurnAction(state, "p1", "ally-inst");
    expect(state.playerA.activeEntities).toHaveLength(0);
    expect((state.playerA.destroyedPile ?? []).some((card) => card.id === "entity-ally")).toBe(true);
    expect(state.playerA.currentEnergy).toBe(5); // 1 + coste 4
    expect(state.playerA.graveyard.some((card) => card.id === "exec-metal-cube-sacrifice")).toBe(true);
    expect(state.pendingTurnAction).toBeNull();
  });

  it("sin entities propias, deja la ejecución en SET a la espera", () => {
    let state = createTestGameState({ phase: "MAIN_1", activePlayerId: "p1", playerA: { hand: [sacrificeCard] } });
    state = GameEngine.playCard(state, "p1", "exec-metal-cube-sacrifice", "ACTIVATE");
    const execInstanceId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", execInstanceId);
    expect(state.playerA.activeExecutions).toHaveLength(1);
    expect(state.pendingTurnAction?.type).not.toBe("SELECT_OWN_ENTITY_TO_SACRIFICE");
  });
});
