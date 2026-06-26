// src/core/use-cases/game-engine/actions/lock-opponent-entity.integration.test.ts - Verifica el bloqueo de entity rival: selección, enforcement de ataque y descuento por turno.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { validateAttackerEntity } from "@/core/use-cases/game-engine/combat/internal/attack-validation";
import { createDeckCard, createTestBoardEntity, createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";

const lockCard: ICard = {
  id: "exec-brave-lock-2", name: "Brave: Escudo", description: "", type: "EXECUTION",
  faction: "OPEN_SOURCE", cost: 3, effect: { action: "LOCK_OPPONENT_ENTITY", turns: 2 },
};
const enemyCard: ICard = { id: "enemy-card", name: "Enemy", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 2, attack: 1500, defense: 800 };

describe("LOCK_OPPONENT_ENTITY", () => {
  it("bloquea la entity rival elegida y manda la ejecución al cementerio", () => {
    let state = createTestGameState({
      phase: "MAIN_1",
      activePlayerId: "p1",
      playerA: { hand: [lockCard] },
      playerB: { activeEntities: [createTestBoardEntity("enemy-inst", enemyCard, "ATTACK")] },
    });
    state = GameEngine.playCard(state, "p1", "exec-brave-lock-2", "ACTIVATE");
    const execInstanceId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", execInstanceId);

    expect(state.pendingTurnAction?.type).toBe("SELECT_OPPONENT_ENTITY_TO_LOCK");

    state = GameEngine.resolvePendingTurnAction(state, "p1", "enemy-inst");
    expect(state.playerB.activeEntities[0].lockedTurnsRemaining).toBe(2);
    expect(state.playerA.activeExecutions).toHaveLength(0);
    expect(state.playerA.graveyard.some((card) => card.id === "exec-brave-lock-2")).toBe(true);
    expect(state.pendingTurnAction).toBeNull();
  });

  it("una entity bloqueada no puede declararse atacante", () => {
    const locked = createTestBoardEntity("x", enemyCard, "ATTACK", { lockedTurnsRemaining: 1 });
    expect(() => validateAttackerEntity(locked)).toThrow(/bloqueada/i);
  });

  it("descuenta el bloqueo al terminar el turno del dueño", () => {
    const locked = createTestBoardEntity("locked-inst", enemyCard, "ATTACK", { lockedTurnsRemaining: 2 });
    let state = createTestGameState({
      phase: "BATTLE",
      activePlayerId: "p2",
      turn: 2,
      playerA: { deck: [createDeckCard("draw-1")] },
      playerB: { activeEntities: [locked] },
    });
    state = GameEngine.nextPhase(state);
    // p2 es el jugador saliente -> su bloqueo baja de 2 a 1.
    expect(state.playerB.activeEntities[0].lockedTurnsRemaining).toBe(1);
  });
});
