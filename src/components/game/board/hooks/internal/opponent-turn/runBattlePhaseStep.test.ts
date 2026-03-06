// src/components/game/board/hooks/internal/opponent-turn/runBattlePhaseStep.test.ts - Verifica reveal breve de objetivo SET en ataque automático.
import { describe, expect, it, vi } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentTurnContext } from "./types";
import { runBattlePhaseStep } from "./runBattlePhaseStep";

function createState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Player",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 5,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [
        {
          instanceId: "defender-set",
          card: { id: "def", name: "Def", description: "Def", type: "ENTITY", faction: "NEUTRAL", cost: 1 },
          mode: "SET",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
      ],
      activeExecutions: [],
    },
    playerB: {
      id: "p2",
      name: "Bot",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 5,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [
        {
          instanceId: "attacker",
          card: { id: "atk", name: "Atk", description: "Atk", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack: 1500 },
          mode: "ATTACK",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
      ],
      activeExecutions: [],
    },
    activePlayerId: "p2",
    startingPlayerId: "p1",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: true,
    combatLog: [],
    pendingTurnAction: null,
  };
}

describe("runBattlePhaseStep", () => {
  it("debería revelar y ocultar objetivo SET durante ataque del oponente", async () => {
    const setRevealedEntities = vi.fn();
    const state = createState();
    const context: IOpponentTurnContext = {
      gameState: state,
      strategy: {
        choosePlay: () => null,
        chooseAttack: () => ({ attackerInstanceId: "attacker", defenderInstanceId: "defender-set" }),
      },
      applyTransition: (transition) => transition(state),
      clearSelection: vi.fn(),
      clearError: vi.fn(),
      setIsAnimating: vi.fn(),
      setActiveAttackerId: vi.fn(),
      setRevealedEntities,
    };
    const timings = { stepDelayMs: 0, attackWindupMs: 0, postResolutionMs: 0, trapPreviewMs: 0 };

    await runBattlePhaseStep(context, timings);

    expect(setRevealedEntities).toHaveBeenCalledTimes(2);
  });
});
