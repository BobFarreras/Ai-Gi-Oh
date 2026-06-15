// src/components/internal/PerformanceProfileToggle.test.tsx - Verifica el ciclo y persistencia del botón global de perfil de efectos.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY } from "@/services/performance/combat-effects-override";
import { PerformanceProfileToggle } from "./PerformanceProfileToggle";

describe("PerformanceProfileToggle", () => {
  afterEach(() => {
    window.localStorage.removeItem(COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY);
  });

  it("arranca en Auto y cicla a Mín y Máx persistiendo el override", async () => {
    render(<PerformanceProfileToggle />);
    const button = await screen.findByRole("button", { name: /perfil de efectos visuales/i });
    expect(button).toHaveTextContent("FX: Auto");

    fireEvent.click(button);
    expect(button).toHaveTextContent("FX: Mín");
    expect(window.localStorage.getItem(COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY)).toBe("reduced");

    fireEvent.click(button);
    expect(button).toHaveTextContent("FX: Máx");
    expect(window.localStorage.getItem(COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY)).toBe("full");

    fireEvent.click(button);
    expect(button).toHaveTextContent("FX: Auto");
    expect(window.localStorage.getItem(COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY)).toBeNull();
  });

  it("recupera el override persistido al montar", async () => {
    window.localStorage.setItem(COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY, "reduced");
    render(<PerformanceProfileToggle />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /perfil de efectos visuales/i })).toHaveTextContent("FX: Mín");
    });
  });
});
