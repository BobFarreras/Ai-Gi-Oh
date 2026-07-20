// src/components/game/board/hooks/internal/board-state/useBoardUiState.pause-counter.test.ts - Verifica el
// contador anti-AFK de turnos en pausa (multi): incrementa por timeout y se reinicia al reanudar la partida.
import { act, renderHook } from "@testing-library/react";
import { MutableRefObject } from "react";
import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { useBoardUiState } from "./useBoardUiState";

function makeState(): GameState {
  return {
    turn: 1,
    phase: "MAIN_1",
    activePlayerId: "p1",
    pendingTurnAction: null,
    combatLog: [],
    playerA: { id: "p1", healthPoints: 100, maxHealthPoints: 100, hand: [], activeEntities: [], graveyard: [] },
    playerB: { id: "p2", healthPoints: 100, maxHealthPoints: 100, hand: [], activeEntities: [], graveyard: [] },
  } as unknown as GameState;
}

function setup() {
  const ref: MutableRefObject<GameState> = { current: makeState() };
  return renderHook(() => useBoardUiState(ref, () => makeState()));
}

describe("useBoardUiState — contador de turnos en pausa", () => {
  it("registerPausedTurnTimeout incrementa y devuelve el nuevo total", () => {
    const { result } = setup();
    let first = 0;
    let second = 0;
    act(() => {
      first = result.current.registerPausedTurnTimeout();
    });
    act(() => {
      second = result.current.registerPausedTurnTimeout();
    });
    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(result.current.pausedTurnTimeouts).toBe(2);
  });

  it("reanudar (togglePause de pausa→activa) reinicia el contador a 0", () => {
    const { result } = setup();
    // Activa pausa y acumula timeouts.
    act(() => {
      result.current.togglePause();
    });
    act(() => {
      result.current.registerPausedTurnTimeout();
      result.current.registerPausedTurnTimeout();
    });
    expect(result.current.pausedTurnTimeouts).toBe(2);
    // Reanuda: el contador vuelve a 0.
    act(() => {
      result.current.togglePause();
    });
    expect(result.current.isPaused).toBe(false);
    expect(result.current.pausedTurnTimeouts).toBe(0);
  });
});
