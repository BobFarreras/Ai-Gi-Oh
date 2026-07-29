// src/components/game/board/hooks/internal/opponent-turn/runBattlePhaseStep.test.ts - Verifica reveal breve de objetivo SET en ataque automático.
import { describe, expect, it, vi } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentTurnContext } from "./types";
import { runBattlePhaseStep } from "./runBattlePhaseStep";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";

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
      setSelectedCard: vi.fn(),
      requestTrapActivationDecision: vi.fn(async () => ({ activate: true })),
    };
    const timings = { stepDelayMs: 0, attackWindupMs: 0, postResolutionMs: 0, trapPreviewMs: 0 };

    await runBattlePhaseStep(context, timings);

    expect(setRevealedEntities).toHaveBeenCalledTimes(2);
  });

  it("no intenta atacar si el oponente es jugador inicial en turno 1", async () => {
    const setActiveAttackerId = vi.fn();
    const state = {
      ...createState(),
      turn: 1,
      startingPlayerId: "p2",
      activePlayerId: "p2",
    } as GameState;
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
      setActiveAttackerId,
      setRevealedEntities: vi.fn(),
      setSelectedCard: vi.fn(),
      requestTrapActivationDecision: vi.fn(async () => ({ activate: true })),
    };
    const timings = { stepDelayMs: 0, attackWindupMs: 0, postResolutionMs: 0, trapPreviewMs: 0 };

    await runBattlePhaseStep(context, timings);

    expect(setActiveAttackerId).toHaveBeenCalledWith(null);
    expect(context.clearSelection).toHaveBeenCalledTimes(1);
    expect(context.clearError).toHaveBeenCalledTimes(1);
  });

  it("aplica el repliegue defensivo universal antes de terminar la fase", async () => {
    let state = createState();
    state = {
      ...state,
      playerA: {
        ...state.playerA,
        activeEntities: [{
          ...state.playerA.activeEntities[0],
          mode: "ATTACK",
          card: { ...state.playerA.activeEntities[0].card, attack: 2200, defense: 800 },
        }],
      },
      playerB: {
        ...state.playerB,
        activeEntities: [{
          ...state.playerB.activeEntities[0],
          card: { ...state.playerB.activeEntities[0].card, attack: 1200, defense: 2400 },
        }],
      },
    };
    const context: IOpponentTurnContext = {
      gameState: state,
      strategy: new HeuristicOpponentStrategy({ difficulty: "EASY" }),
      applyTransition: (transition) => {
        state = transition(state);
        return state;
      },
      clearSelection: vi.fn(),
      clearError: vi.fn(),
      setIsAnimating: vi.fn(),
      setActiveAttackerId: vi.fn(),
      setRevealedEntities: vi.fn(),
      setSelectedCard: vi.fn(),
      requestTrapActivationDecision: vi.fn(async () => ({ activate: false })),
    };

    await runBattlePhaseStep(context, { stepDelayMs: 0, attackWindupMs: 0, postResolutionMs: 0, trapPreviewMs: 0 });

    expect(state.playerB.activeEntities[0].mode).toBe("DEFENSE");
    expect(state.phase).toBe("BATTLE");
  });
});
