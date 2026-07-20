// src/components/game/board/hooks/internal/board-state/useHandleTimerExpired.test.ts - Cubre el timeout de turno:
// una fase en single-player vs. ceder el turno ENTERO al rival en multi (endEntireTurn), y la auto-resolución
// de la acción obligatoria de descarte.
import { renderHook } from "@testing-library/react";
import { MutableRefObject } from "react";
import { describe, expect, it, vi } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { useHandleTimerExpired } from "./useHandleTimerExpired";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    turn: 1,
    phase: "MAIN_1",
    activePlayerId: "p1",
    pendingTurnAction: null,
    combatLog: [],
    playerA: { id: "p1", healthPoints: 100, maxHealthPoints: 100, hand: [], activeEntities: [], graveyard: [] },
    playerB: { id: "p2", healthPoints: 100, maxHealthPoints: 100, hand: [], activeEntities: [], graveyard: [] },
    ...overrides,
  } as unknown as GameState;
}

/** executeAdvancePhase de mentira: modela MAIN_1→BATTLE (mismo jugador) y BATTLE→rival (cambia activePlayerId). */
function makeAdvancePhase(ref: MutableRefObject<GameState>) {
  return vi.fn(() => {
    const s = ref.current;
    if (s.phase === "MAIN_1") ref.current = { ...s, phase: "BATTLE" } as GameState;
    else if (s.phase === "BATTLE") ref.current = { ...s, phase: "MAIN_1", activePlayerId: "p2", turn: s.turn + 1 } as GameState;
  });
}

describe("useHandleTimerExpired", () => {
  it("single-player: avanza SOLO una fase (MAIN_1→BATTLE), no cede el turno", () => {
    const ref: MutableRefObject<GameState> = { current: makeState() };
    const executeAdvancePhase = makeAdvancePhase(ref);
    const { result } = renderHook(() =>
      useHandleTimerExpired({ gameStateRef: ref, isAnimating: false, executeAdvancePhase, resolvePendingTurnAction: vi.fn(), endEntireTurn: false }),
    );
    result.current();
    expect(executeAdvancePhase).toHaveBeenCalledTimes(1);
    expect(ref.current.phase).toBe("BATTLE");
    expect(ref.current.activePlayerId).toBe("p1");
  });

  it("multi: cede el turno ENTERO al rival (avanza fases hasta cambiar de jugador)", () => {
    const ref: MutableRefObject<GameState> = { current: makeState() };
    const executeAdvancePhase = makeAdvancePhase(ref);
    const { result } = renderHook(() =>
      useHandleTimerExpired({ gameStateRef: ref, isAnimating: false, executeAdvancePhase, resolvePendingTurnAction: vi.fn(), endEntireTurn: true }),
    );
    result.current();
    expect(executeAdvancePhase).toHaveBeenCalledTimes(2);
    expect(ref.current.activePlayerId).toBe("p2");
  });

  it("multi: auto-resuelve el descarte obligatorio y luego cede el turno", () => {
    const hand = [{ id: "c1", runtimeId: "r1" }] as unknown as GameState["playerA"]["hand"];
    const ref: MutableRefObject<GameState> = {
      current: makeState({
        pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT", playerId: "p1" } as GameState["pendingTurnAction"],
        playerA: { id: "p1", healthPoints: 100, maxHealthPoints: 100, hand, activeEntities: [], graveyard: [] } as unknown as GameState["playerA"],
      }),
    };
    const executeAdvancePhase = makeAdvancePhase(ref);
    const resolvePendingTurnAction = vi.fn(() => {
      ref.current = { ...ref.current, pendingTurnAction: null } as GameState;
    });
    const { result } = renderHook(() =>
      useHandleTimerExpired({ gameStateRef: ref, isAnimating: false, executeAdvancePhase, resolvePendingTurnAction, endEntireTurn: true }),
    );
    result.current();
    expect(resolvePendingTurnAction).toHaveBeenCalledWith("r1");
    expect(ref.current.activePlayerId).toBe("p2");
  });

  it("no hace nada si no es el turno del jugador local", () => {
    const ref: MutableRefObject<GameState> = { current: makeState({ activePlayerId: "p2" }) };
    const executeAdvancePhase = makeAdvancePhase(ref);
    const { result } = renderHook(() =>
      useHandleTimerExpired({ gameStateRef: ref, isAnimating: false, executeAdvancePhase, resolvePendingTurnAction: vi.fn(), endEntireTurn: true }),
    );
    result.current();
    expect(executeAdvancePhase).not.toHaveBeenCalled();
  });

  it("no hace nada mientras hay una animación en curso", () => {
    const ref: MutableRefObject<GameState> = { current: makeState() };
    const executeAdvancePhase = makeAdvancePhase(ref);
    const { result } = renderHook(() =>
      useHandleTimerExpired({ gameStateRef: ref, isAnimating: true, executeAdvancePhase, resolvePendingTurnAction: vi.fn(), endEntireTurn: true }),
    );
    result.current();
    expect(executeAdvancePhase).not.toHaveBeenCalled();
  });
});
