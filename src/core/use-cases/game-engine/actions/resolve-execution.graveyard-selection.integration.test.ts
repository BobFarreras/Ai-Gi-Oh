// src/core/use-cases/game-engine/actions/resolve-execution.graveyard-selection.integration.test.ts - Verifica flujo pendiente para revivir desde cementerio con selección manual.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

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

function createPlayer(id: string): IPlayer {
  return {
    id,
    name: id,
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 10,
    maxEnergy: 10,
    deck: [],
    fusionDeck: [],
    hand: [],
    graveyard: [],
    destroyedPile: [],
    activeEntities: [],
    activeExecutions: [],
  };
}

function createState(): GameState {
  const executionEntity: IBoardEntity = {
    instanceId: "exec-1",
    card: reviveToHand,
    mode: "ACTIVATE",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
  const playerA = createPlayer("p1");
  playerA.activeExecutions = [executionEntity];
  playerA.graveyard = [graveTrap, revivedEntity];
  return {
    playerA,
    playerB: createPlayer("p2"),
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 1,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
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
