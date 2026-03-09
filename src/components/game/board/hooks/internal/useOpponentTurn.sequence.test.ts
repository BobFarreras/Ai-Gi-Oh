// src/components/game/board/hooks/internal/useOpponentTurn.sequence.test.ts - Valida secuencia temporal de ataque del rival.
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { useOpponentTurn } from "@/components/game/board/hooks/internal/useOpponentTurn";
import { createBattleState } from "@/components/game/board/hooks/internal/useOpponentTurn.test-helpers";

describe("useOpponentTurn sequence", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("mantiene secuencia de ataque: windup -> resolve -> cooldown", async () => {
    const strategy: IOpponentStrategy = { choosePlay: () => null, chooseAttack: () => ({ attackerInstanceId: "bot-attacker" }) };
    let state = createBattleState();
    const applyTransition = vi.fn((transition: (value: GameState) => GameState) => { state = transition(state); return state; });
    const setIsAnimating = vi.fn();

    renderHook(() => useOpponentTurn({
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
    }));

    await act(async () => { await vi.advanceTimersByTimeAsync(1349); });
    expect(applyTransition).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(applyTransition).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(649); });
    expect(setIsAnimating).toHaveBeenLastCalledWith(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(setIsAnimating).toHaveBeenLastCalledWith(false);
  });
});
