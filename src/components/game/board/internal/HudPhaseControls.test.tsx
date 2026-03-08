// src/components/game/board/internal/HudPhaseControls.test.tsx - Verifica estados y transición de botones de fase en HUD del jugador.
import { fireEvent, render, screen } from "@testing-library/react";
import { HudPhaseControls } from "./HudPhaseControls";

describe("HudPhaseControls", () => {
  it("habilita Combate en MAIN y deshabilita Pasar", () => {
    const onAdvancePhase = vi.fn();
    render(<HudPhaseControls phase="MAIN_1" isVisible={true} onAdvancePhase={onAdvancePhase} />);
    const combatButton = screen.getByRole("button", { name: /Combate/i });
    const passButton = screen.getByRole("button", { name: /Pasar/i });
    expect(combatButton).toBeEnabled();
    expect(passButton).toBeDisabled();
    fireEvent.click(combatButton);
    expect(onAdvancePhase).toHaveBeenCalledTimes(1);
  });

  it("habilita Pasar en BATTLE y deshabilita Combate", () => {
    const onAdvancePhase = vi.fn();
    render(<HudPhaseControls phase="BATTLE" isVisible={true} onAdvancePhase={onAdvancePhase} />);
    const combatButton = screen.getByRole("button", { name: /Combate/i });
    const passButton = screen.getByRole("button", { name: /Pasar/i });
    expect(combatButton).toBeDisabled();
    expect(passButton).toBeEnabled();
    fireEvent.click(passButton);
    expect(onAdvancePhase).toHaveBeenCalledTimes(1);
  });
});
