// src/components/game/board/hooks/internal/useOpponentTurn.trap-preview.test.ts - Verifica previsualización de trampa previa a resolución de ataque.
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { useOpponentTurn } from "@/components/game/board/hooks/internal/useOpponentTurn";
import { createBattleState } from "@/components/game/board/hooks/internal/useOpponentTurn.test-helpers";

describe("useOpponentTurn trap preview", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("previsualiza trampa antes de resolver el ataque", async () => {
    const strategy: IOpponentStrategy = { choosePlay: () => null, chooseAttack: () => ({ attackerInstanceId: "bot-attacker" }) };
    let state = createBattleState();
    state = {
      ...state,
      playerA: {
        ...state.playerA,
        activeExecutions: [{
          instanceId: "trap-preview",
          card: { id: "trap-preview-card", name: "Trap", description: "Trap", type: "TRAP", faction: "OPEN_SOURCE", cost: 2, trigger: "ON_OPPONENT_ATTACK_DECLARED", effect: { action: "DAMAGE", target: "OPPONENT", value: 300 } },
          mode: "SET",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        }],
      },
    };
    const applyTransition = vi.fn((transition: (value: GameState) => GameState) => { state = transition(state); return state; });
    const setActiveAttackerId = vi.fn();

    renderHook(() => useOpponentTurn({
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
      setSelectedCard: vi.fn(),
      requestTrapActivationDecision: vi.fn(async () => true),
    }));

    await act(async () => { await vi.advanceTimersByTimeAsync(2749); });
    expect(applyTransition).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(applyTransition).toHaveBeenCalledTimes(1);
    expect(setActiveAttackerId).toHaveBeenCalledWith("trap-preview");
  });
});
