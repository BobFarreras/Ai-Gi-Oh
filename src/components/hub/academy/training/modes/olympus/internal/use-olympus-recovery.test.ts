// src/components/hub/academy/training/modes/olympus/internal/use-olympus-recovery.test.ts - Verifica el retorno seguro al selector de Olimpo.
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { resetOlympusBattle } from "../olympus-api-client";
import { useOlympusRecovery } from "./use-olympus-recovery";

vi.mock("../olympus-api-client", () => ({ resetOlympusBattle: vi.fn() }));

describe("useOlympusRecovery", () => {
  it("cierra la batalla, limpia el runtime y recarga el allowance", async () => {
    vi.mocked(resetOlympusBattle).mockResolvedValue({ forfeited: true });
    const reloadOverview = vi.fn().mockResolvedValue(undefined);
    const setBattle = vi.fn();
    const setSettlement = vi.fn();
    const setError = vi.fn();
    const setIsLoading = vi.fn();
    const { result } = renderHook(() => useOlympusRecovery({
      reloadOverview, setBattle, setSettlement, setError, setIsLoading,
    }));

    await act(async () => { await result.current(); });

    expect(resetOlympusBattle).toHaveBeenCalledOnce();
    expect(setBattle).toHaveBeenCalledWith(null);
    expect(setSettlement).toHaveBeenCalledWith(null);
    expect(reloadOverview).toHaveBeenCalledOnce();
  });

  it("mantiene el tablero y muestra el error si el servidor no puede restaurar", async () => {
    vi.mocked(resetOlympusBattle).mockRejectedValue(new Error("No hay combate pendiente."));
    const setBattle = vi.fn();
    const setError = vi.fn();
    const { result } = renderHook(() => useOlympusRecovery({
      reloadOverview: vi.fn(), setBattle, setSettlement: vi.fn(), setError, setIsLoading: vi.fn(),
    }));

    await act(async () => { await expect(result.current()).resolves.toBe(false); });

    expect(setBattle).not.toHaveBeenCalled();
    expect(setError).toHaveBeenLastCalledWith("No hay combate pendiente.");
  });
});
