// src/components/game/board/hooks/internal/player-actions/handleOwnEntityClick.test.ts - Valida selección de entidad para reemplazo antes de confirmación explícita.
import { describe, expect, it, vi } from "vitest";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { handleOwnEntityClick } from "./handleOwnEntityClick";

function createEntity(instanceId: string): IBoardEntity {
  return {
    instanceId,
    mode: "ATTACK",
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

describe("handleOwnEntityClick reemplazo", () => {
  it("debe seleccionar objetivo y esperar confirmación, sin invocar todavía", async () => {
    const entity = createEntity("entity-instance-1");
    const applyTransition = vi.fn();
    const setSelectedCard = vi.fn();
    const setPendingEntityReplacementTargetId = vi.fn();

    const result = await handleOwnEntityClick({
      entity,
      activeAttackerId: null,
      applyTransition,
      clearSelection: vi.fn(),
      gameState: {
        playerA: { id: "p1", name: "P1", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 10, maxEnergy: 10, deck: [], hand: [], graveyard: [], activeEntities: [entity], activeExecutions: [] },
        playerB: { id: "p2", name: "P2", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 10, maxEnergy: 10, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [] },
        activePlayerId: "p1",
        startingPlayerId: "p1",
        turn: 1,
        phase: "MAIN_1",
        hasNormalSummonedThisTurn: false,
        pendingTurnAction: null,
        combatLog: [],
      },
      pendingFusionSummon: null,
      pendingEntityReplacement: { cardId: "entity-new", mode: "ATTACK", zone: "ENTITIES" },
      pendingEntityReplacementTargetId: null,
      setActiveAttackerId: vi.fn(),
      setLastError: vi.fn(),
      setPendingEntityReplacementTargetId,
      setPendingFusionSummon: vi.fn(),
      setPlayingCard: vi.fn(),
      setSelectedCard,
      setSelectedBoardEntityInstanceId: vi.fn(),
    });

    expect(result).toBe("handled");
    expect(applyTransition).not.toHaveBeenCalled();
    expect(setPendingEntityReplacementTargetId).toHaveBeenCalledWith("entity-instance-1");
    expect(setSelectedCard).toHaveBeenCalledWith(entity.card);
  });

  it("no activa automáticamente una ejecución en SET al hacer click", async () => {
    const execution: IBoardEntity = {
      instanceId: "execution-set-1",
      mode: "SET",
      hasAttackedThisTurn: false,
      isNewlySummoned: false,
      card: {
        id: "execution-test",
        name: "Execution Test",
        description: "Carta de ejecución en set",
        type: "EXECUTION",
        faction: "NO_CODE",
        cost: 2,
        effect: { action: "HEAL", target: "PLAYER", value: 200 },
      },
    };
    const applyTransition = vi.fn();
    const setSelectedCard = vi.fn();
    const setSelectedBoardEntityInstanceId = vi.fn();

    const result = await handleOwnEntityClick({
      entity: execution,
      activeAttackerId: null,
      applyTransition,
      clearSelection: vi.fn(),
      gameState: {
        playerA: { id: "p1", name: "P1", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 10, maxEnergy: 10, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [execution] },
        playerB: { id: "p2", name: "P2", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 10, maxEnergy: 10, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [] },
        activePlayerId: "p1",
        startingPlayerId: "p1",
        turn: 1,
        phase: "MAIN_1",
        hasNormalSummonedThisTurn: false,
        pendingTurnAction: null,
        combatLog: [],
      },
      pendingFusionSummon: null,
      pendingEntityReplacement: null,
      pendingEntityReplacementTargetId: null,
      setActiveAttackerId: vi.fn(),
      setLastError: vi.fn(),
      setPendingEntityReplacementTargetId: vi.fn(),
      setPendingFusionSummon: vi.fn(),
      setPlayingCard: vi.fn(),
      setSelectedCard,
      setSelectedBoardEntityInstanceId,
    });

    expect(result).toBe("handled");
    expect(applyTransition).not.toHaveBeenCalled();
    expect(setSelectedCard).toHaveBeenCalledWith(execution.card);
    expect(setSelectedBoardEntityInstanceId).toHaveBeenCalledWith("execution-set-1");
  });
});
