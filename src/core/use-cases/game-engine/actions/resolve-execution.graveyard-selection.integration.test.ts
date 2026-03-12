// src/core/use-cases/game-engine/actions/resolve-execution.graveyard-selection.integration.test.ts - Verifica flujo pendiente para revivir desde cementerio con selección manual.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import {
  createExecutionEntity,
  createExecutionTestPlayer,
  createResolveExecutionBaseState,
} from "@/core/use-cases/game-engine/effects/resolve-execution.test-fixtures";

const reviveToHand: ICard = {
  id: "exec-revive-hand",
  name: "Recover",
  description: "Devuelve entidad del cementerio a la mano.",
  type: "EXECUTION",
  faction: "NEUTRAL",
  cost: 2,
  effect: { action: "RETURN_GRAVEYARD_CARD_TO_HAND", cardType: "ENTITY" },
};

const revivedEntity: ICard = {
  id: "entity-rust",
  runtimeId: "grave-rust-1",
  name: "Rust",
  description: "Entidad.",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 3,
  attack: 1500,
  defense: 1000,
};

const graveTrap: ICard = {
  id: "trap-ignore",
  runtimeId: "grave-trap-1",
  name: "Trap",
  description: "Trampa.",
  type: "TRAP",
  faction: "NEUTRAL",
  cost: 1,
};

function createState(): GameState {
  const executionEntity = createExecutionEntity("exec-1", reviveToHand);
  const playerA = createExecutionTestPlayer("p1");
  playerA.activeExecutions = [executionEntity];
  playerA.graveyard = [graveTrap, revivedEntity];
  return createResolveExecutionBaseState(playerA);
}

describe("resolveExecution con selección de cementerio", () => {
  it("abre acción pendiente y revive la carta seleccionada", () => {
    let state = createState();
    state = GameEngine.resolveExecution(state, "p1", "exec-1");

    expect(state.pendingTurnAction?.type).toBe("SELECT_GRAVEYARD_CARD");
    expect(state.pendingTurnAction?.playerId).toBe("p1");

    state = GameEngine.resolvePendingTurnAction(state, "p1", "grave-rust-1");

    expect(state.pendingTurnAction).toBeNull();
    expect(state.playerA.hand.map((card) => card.id)).toContain("entity-rust");
    expect(state.playerA.activeExecutions).toHaveLength(0);
    expect(state.playerA.graveyard.map((card) => card.id)).toContain("exec-revive-hand");
  });

  it("rechaza selección inválida por tipo de efecto", () => {
    let state = createState();
    state = GameEngine.resolveExecution(state, "p1", "exec-1");

    expect(() => GameEngine.resolvePendingTurnAction(state, "p1", "grave-trap-1")).toThrow(
      "La carta seleccionada no cumple el tipo permitido.",
    );
  });
});
