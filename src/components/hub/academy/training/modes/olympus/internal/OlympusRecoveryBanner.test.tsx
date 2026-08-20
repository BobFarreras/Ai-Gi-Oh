// src/components/hub/academy/training/modes/olympus/internal/OlympusRecoveryBanner.test.tsx - Verifica la salida accesible de un combate bloqueado.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OlympusRecoveryBanner } from "./OlympusRecoveryBanner";

describe("OlympusRecoveryBanner", () => {
  it("explica el coste y permite abandonar el combate bloqueado", () => {
    const onReset = vi.fn();
    render(<OlympusRecoveryBanner error="No se pudo validar." isLoading={false} onReset={onReset} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/cerrará este combate como derrota/i);
    fireEvent.click(screen.getByRole("button", { name: /restaurar olimpo/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("impide dobles clics durante la recuperación", () => {
    render(<OlympusRecoveryBanner error="Error" isLoading onReset={vi.fn()} />);
    expect(screen.getByRole("button", { name: /restaurando/i })).toBeDisabled();
  });
});
