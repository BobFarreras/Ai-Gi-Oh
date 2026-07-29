// src/components/game/board/hooks/internal/player-actions/handleOwnEntityClick.mode.test.ts - Valida el gesto de cambio de modo en entidades propias.
import { describe, expect, it, vi } from "vitest";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { handleOwnEntityClick } from "./handleOwnEntityClick";
import { IHandleOwnEntityClickParams } from "./handle-own-entity-click.types";

function createSetEntity(): IBoardEntity {
  return {
    instanceId: "entity-set-1",
    mode: "SET",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
    card: {
      id: "entity-test",
      name: "Test Entity",
      description: "Carta de prueba",
      type: "ENTITY",
      faction: "OPEN_SOURCE",
      cost: 2,
      attack: 1200,
      defense: 1000,
    },
  };
}

function createGameState(entity: IBoardEntity): GameState {
  const createPlayer = (id: string) => ({
    id,
    name: id,
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 10,
    maxEnergy: 10,
    deck: [],
    hand: [],
    graveyard: [],
    activeEntities: id === "p1" ? [entity] : [],
    activeExecutions: [],
  });
  return {
    playerA: createPlayer("p1"),
    playerB: createPlayer("p2"),
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 1,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
}

function createParams(entity: IBoardEntity): IHandleOwnEntityClickParams {
  return {
    entity,
    event: { detail: 1 } as React.MouseEvent,
    activeAttackerId: null,
    applyTransition: vi.fn(),
    clearSelection: vi.fn(),
    gameState: createGameState(entity),
    pendingFusionSummon: null,
    pendingEntityReplacement: null,
    pendingEntityReplacementTargetId: null,
    setActiveAttackerId: vi.fn(),
    setLastError: vi.fn(),
    setPendingEntityReplacementTargetId: vi.fn(),
    setPendingFusionSummon: vi.fn(),
    setPlayingCard: vi.fn(),
    setSelectedCard: vi.fn(),
    setSelectedBoardEntityInstanceId: vi.fn(),
  };
}

describe("handleOwnEntityClick cambio de modo", () => {
  it("voltea una ENTITY propia de SET a DEFENSE con doble click", async () => {
    const entity = createSetEntity();
    const params = createParams(entity);
    const applyTransition = vi.fn((transition: (state: GameState) => GameState) => transition(params.gameState));

    await handleOwnEntityClick({ ...params, event: { detail: 2 } as React.MouseEvent, applyTransition });

    expect(applyTransition).toHaveBeenCalledOnce();
    expect(applyTransition.mock.results[0].value.playerA.activeEntities[0].mode).toBe("DEFENSE");
  });

  it("mantiene una ENTITY propia en SET con un solo click", async () => {
    const params = createParams(createSetEntity());

    await handleOwnEntityClick(params);

    expect(params.applyTransition).not.toHaveBeenCalled();
  });
});
