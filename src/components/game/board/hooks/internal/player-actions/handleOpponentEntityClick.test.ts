// src/components/game/board/hooks/internal/player-actions/handleOpponentEntityClick.test.ts - Garantiza reveal breve al atacar una carta oculta rival.
import { describe, expect, it, vi } from "vitest";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { handleOpponentEntityClick } from "./handleOpponentEntityClick";

function createState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "A",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 5,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [
        {
          instanceId: "attacker-1",
          card: { id: "atk-1", name: "Atacante", description: "x", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack: 1500 },
          mode: "ATTACK",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
      ],
      activeExecutions: [],
    },
    playerB: {
      id: "p2",
      name: "B",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 5,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [
        {
          instanceId: "target-set",
          card: { id: "def-1", name: "Defensora", description: "x", type: "ENTITY", faction: "NEUTRAL", cost: 1, defense: 1600 },
          mode: "SET",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
      ],
      activeExecutions: [],
    },
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: true,
    combatLog: [],
    pendingTurnAction: null,
  };
}

describe("handleOpponentEntityClick", () => {
  it("debería revelar y ocultar objetivo SET durante la secuencia de ataque", async () => {
    const state = createState();
    const target: IBoardEntity = {
      instanceId: "target-set",
      card: { id: "c1", name: "Oculta", description: "x", type: "ENTITY", faction: "NEUTRAL", cost: 1 },
      mode: "SET",
      hasAttackedThisTurn: false,
      isNewlySummoned: false,
    };
    const setRevealedEntities = vi.fn();

    await handleOpponentEntityClick({
      entity: target,
      activeAttackerId: "attacker-1",
      applyTransition: (transition) => transition(state),
      clearSelection: vi.fn(),
      gameState: state,
      setActiveAttackerId: vi.fn(),
      setIsAnimating: vi.fn(),
      setRevealedEntities,
      setSelectedCard: vi.fn(),
    });

    expect(setRevealedEntities).toHaveBeenCalledTimes(2);
  });
});
