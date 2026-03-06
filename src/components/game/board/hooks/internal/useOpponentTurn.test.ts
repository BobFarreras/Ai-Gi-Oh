import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { useOpponentTurn } from "./useOpponentTurn";

function createBattleState(): GameState {
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
      activeEntities: [],
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
          instanceId: "bot-attacker",
          card: {
            id: "bot-attacker-card",
            name: "Bot",
            description: "Atacante",
            type: "ENTITY",
            faction: "OPEN_SOURCE",
            cost: 3,
            attack: 1600,
            defense: 900,
          },
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
  };
}

describe("useOpponentTurn", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("mantiene secuencia de ataque: windup -> resolve -> cooldown", async () => {
    const strategy: IOpponentStrategy = {
      choosePlay: () => null,
      chooseAttack: () => ({ attackerInstanceId: "bot-attacker" }),
    };
    let state = createBattleState();
    const applyTransition = vi.fn((transition: (value: GameState) => GameState) => {
      state = transition(state);
      return state;
    });
    const setIsAnimating = vi.fn();

    renderHook(() =>
      useOpponentTurn({
        gameState: state,
        isAnimating: false,
        strategy,
        duelWinnerId: null,
        applyTransition,
        clearSelection: vi.fn(),
        clearError: vi.fn(),
        setIsAnimating,
        setActiveAttackerId: vi.fn(),
        setRevealedEntities: vi.fn(),
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1349);
    });
    expect(applyTransition).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(applyTransition).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(649);
    });
    expect(setIsAnimating).toHaveBeenLastCalledWith(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(setIsAnimating).toHaveBeenLastCalledWith(false);
  });

  it("previsualiza trampa antes de resolver el ataque", async () => {
    const strategy: IOpponentStrategy = {
      choosePlay: () => null,
      chooseAttack: () => ({ attackerInstanceId: "bot-attacker" }),
    };
    let state = createBattleState();
    state = {
      ...state,
      playerA: {
        ...state.playerA,
        activeExecutions: [
          {
            instanceId: "trap-preview",
            card: {
              id: "trap-preview-card",
              name: "Trap",
              description: "Trap",
              type: "TRAP",
              faction: "OPEN_SOURCE",
              cost: 2,
              trigger: "ON_OPPONENT_ATTACK_DECLARED",
              effect: { action: "DAMAGE", target: "OPPONENT", value: 300 },
            },
            mode: "SET",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
    };
    const applyTransition = vi.fn((transition: (value: GameState) => GameState) => {
      state = transition(state);
      return state;
    });
    const setActiveAttackerId = vi.fn();

    renderHook(() =>
      useOpponentTurn({
        gameState: state,
        isAnimating: false,
        strategy,
        duelWinnerId: null,
        applyTransition,
        clearSelection: vi.fn(),
        clearError: vi.fn(),
        setIsAnimating: vi.fn(),
        setActiveAttackerId,
        setRevealedEntities: vi.fn(),
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2049);
    });
    expect(applyTransition).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(applyTransition).toHaveBeenCalledTimes(1);
    expect(setActiveAttackerId).toHaveBeenCalledWith("trap-preview");
  });
});
