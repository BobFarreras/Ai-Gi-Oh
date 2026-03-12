// src/components/hub/home/internal/view/HomeIncompleteDeckExitDialog.test.tsx - Verifica acciones disponibles en el diálogo de salida con deck incompleto.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeIncompleteDeckExitDialog } from "./HomeIncompleteDeckExitDialog";

describe("HomeIncompleteDeckExitDialog", () => {
  it("ejecuta callbacks de salir, market y cerrar", () => {
    const onClose = vi.fn();
    const onExitToHub = vi.fn();
    const onGoToMarket = vi.fn();

    render(
      <HomeIncompleteDeckExitDialog
        isOpen={true}
        deckCardCount={13}
        deckSize={20}
        onClose={onClose}
        onExitToHub={onExitToHub}
        onGoToMarket={onGoToMarket}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Salir Igual" }));
    fireEvent.click(screen.getByRole("button", { name: "Ir al Market" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onExitToHub).toHaveBeenCalledTimes(1);
    expect(onGoToMarket).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
