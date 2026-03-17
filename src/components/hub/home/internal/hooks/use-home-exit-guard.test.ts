// src/components/hub/home/internal/hooks/use-home-exit-guard.test.ts - Valida flujo de salida de Arsenal con deck incompleto y acciones del diálogo.
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useHomeExitGuard } from "./use-home-exit-guard";

describe("useHomeExitGuard", () => {
  it("abre diálogo cuando el deck está incompleto y permite navegar a Market", () => {
    const onNavigate = vi.fn();
    const play = vi.fn();
    const { result } = renderHook(() =>
      useHomeExitGuard({
        deckCardCount: 12,
        deckSize: 20,
        onNavigate,
        play,
      }),
    );

    act(() => result.current.handleBackToHubRequest());
    expect(result.current.isExitDialogOpen).toBe(true);
    expect(play).toHaveBeenCalledWith("ERROR_COMMON");
    expect(onNavigate).not.toHaveBeenCalled();

    act(() => result.current.goToMarket());
    expect(result.current.isExitDialogOpen).toBe(false);
    expect(onNavigate).toHaveBeenCalledWith("/hub/market");
  });

  it("sale directo al hub cuando el deck está completo", () => {
    const onNavigate = vi.fn();
    const play = vi.fn();
    const { result } = renderHook(() =>
      useHomeExitGuard({
        deckCardCount: 20,
        deckSize: 20,
        onNavigate,
        play,
      }),
    );

    act(() => result.current.handleBackToHubRequest());
    expect(result.current.isExitDialogOpen).toBe(false);
    expect(onNavigate).toHaveBeenCalledWith("/hub");
  });
});
