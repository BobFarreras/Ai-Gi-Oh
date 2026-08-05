// src/components/hub/academy/training/modes/survival/internal/SurvivalRecoveryBanner.test.tsx - Verifica la recuperación accesible del banner de error.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SurvivalRecoveryBanner } from "./SurvivalRecoveryBanner";

describe("SurvivalRecoveryBanner", () => {
  it("explica la pérdida de la run y permite reiniciarla", () => {
    const onReset = vi.fn();
    render(<SurvivalRecoveryBanner error="No se pudo validar." isLoading={false} onReset={onReset} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/cerrará esta expedición como derrota/i);
    fireEvent.click(screen.getByRole("button", { name: /reiniciar expedición/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("bloquea dobles clics mientras restaura", () => {
    render(<SurvivalRecoveryBanner error="Error" isLoading onReset={vi.fn()} />);
    expect(screen.getByRole("button", { name: /restaurando/i })).toBeDisabled();
  });
});
