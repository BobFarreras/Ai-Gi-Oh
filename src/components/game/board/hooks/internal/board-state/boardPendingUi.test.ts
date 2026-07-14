// src/components/game/board/hooks/internal/board-state/boardPendingUi.test.ts - Valida textos de acciones pendientes para evitar hints incorrectos en UI.
import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { buildBoardPendingUi } from "./boardPendingUi";

function createBaseState(): GameState {
  return {
    playerA: { id: "p1", name: "Player", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 10, maxEnergy: 10, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [], destroyedPile: [] },
    playerB: { id: "p2", name: "Bot", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 10, maxEnergy: 10, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [], destroyedPile: [] },
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 3,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
}

describe("boardPendingUi", () => {
  it("muestra hint de cementerio rival para selección STEAL_OPPONENT_GRAVEYARD_CARD", () => {
    const state: GameState = {
      ...createBaseState(),
      pendingTurnAction: {
        type: "SELECT_OPPONENT_GRAVEYARD_CARD",
        playerId: "p1",
        executionInstanceId: "exec-1",
        cardType: "ENTITY",
      },
    };
    const pending = buildBoardPendingUi(state, null);
    expect(pending.pendingActionHint).toContain("cementerio rival");
  });

  it("muestra hint de carta seteada rival para SELECT_OPPONENT_SET_CARD", () => {
    const state: GameState = {
      ...createBaseState(),
      pendingTurnAction: {
        type: "SELECT_OPPONENT_SET_CARD",
        playerId: "p1",
        executionInstanceId: "exec-2",
        zone: "ANY",
      },
    };
    const pending = buildBoardPendingUi(state, null);
    expect(pending.pendingActionHint).toContain("seteada");
  });

  it("marca como seleccionables las cartas SET del rival según la zona (ANY)", () => {
    const base = createBaseState();
    const state: GameState = {
      ...base,
      playerB: {
        ...base.playerB,
        activeEntities: [
          { instanceId: "ent-set", mode: "SET", card: { id: "c1", type: "ENTITY" } },
          { instanceId: "ent-attack", mode: "ATTACK", card: { id: "c2", type: "ENTITY" } },
        ] as unknown as GameState["playerB"]["activeEntities"],
        activeExecutions: [
          { instanceId: "exec-set", mode: "SET", card: { id: "c3", type: "TRAP" } },
        ] as unknown as GameState["playerB"]["activeExecutions"],
      },
      pendingTurnAction: { type: "SELECT_OPPONENT_SET_CARD", playerId: "p1", executionInstanceId: "exec-2", zone: "ANY" },
    };
    const pending = buildBoardPendingUi(state, null);
    expect(pending.pendingOpponentSelectionIds).toEqual(["ent-set", "exec-set"]);
  });

  it("el reemplazo de zona resalta las cartas propias pero NO usa el banner de acción obligatoria", () => {
    // El reemplazo es cancelable, así que se anuncia con su barra propia (persistente y con botón de salir),
    // no con el banner de "acción obligatoria", que se autooculta a los segundos y no se puede abortar.
    const base = createBaseState();
    const state: GameState = {
      ...base,
      playerA: {
        ...base.playerA,
        activeExecutions: [
          { instanceId: "own-trap-1", mode: "SET", card: { id: "t1", type: "TRAP" } },
          { instanceId: "own-trap-2", mode: "SET", card: { id: "t2", type: "TRAP" } },
        ] as unknown as GameState["playerA"]["activeExecutions"],
      },
    };
    const pending = buildBoardPendingUi(state, { cardId: "nueva", mode: "SET", zone: "EXECUTIONS" });
    expect(pending.pendingEntitySelectionIds).toEqual(["own-trap-1", "own-trap-2"]);
    expect(pending.pendingActionHint).toBeNull();
  });

  it("respeta la zona EXECUTIONS (solo ejecuciones seteadas del rival)", () => {
    const base = createBaseState();
    const state: GameState = {
      ...base,
      playerB: {
        ...base.playerB,
        activeEntities: [{ instanceId: "ent-set", mode: "SET", card: { id: "c1", type: "ENTITY" } }] as unknown as GameState["playerB"]["activeEntities"],
        activeExecutions: [{ instanceId: "exec-set", mode: "SET", card: { id: "c3", type: "TRAP" } }] as unknown as GameState["playerB"]["activeExecutions"],
      },
      pendingTurnAction: { type: "SELECT_OPPONENT_SET_CARD", playerId: "p1", executionInstanceId: "exec-2", zone: "EXECUTIONS" },
    };
    const pending = buildBoardPendingUi(state, null);
    expect(pending.pendingOpponentSelectionIds).toEqual(["exec-set"]);
  });
});

