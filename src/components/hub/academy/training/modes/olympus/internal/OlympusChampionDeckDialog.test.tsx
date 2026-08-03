// src/components/hub/academy/training/modes/olympus/internal/OlympusChampionDeckDialog.test.tsx - La ficha de la carta tiene que abrirse por encima del mazo.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OlympusChampionDeckDialog } from "./OlympusChampionDeckDialog";

// La factoría se iza al principio del fichero: las cartas se construyen dentro, sin variables externas.
vi.mock("../olympus-api-client", () => {
  const card = (id: string, name: string) => ({
    id, name, description: `Descripción de ${name}`, type: "ENTITY", faction: "BIG_TECH",
    cost: 4, attack: 1800, defense: 1200, level: 29, versionTier: 4, xp: 0,
  });
  return {
    fetchChampionDeck: vi.fn().mockResolvedValue({
      championId: "gennvim", displayName: "GenNvim",
      deck: [card("entity-a", "Vanguardia Neón"), card("entity-b", "Kernel Táctico")],
      fusionDeck: [], level: 29, versionTier: 4, startingLp: 8000, energyBonus: 0,
    }),
  };
});

describe("OlympusChampionDeckDialog", () => {
  it("abre la ficha completa de la carta al pulsarla, en su propio diálogo", async () => {
    render(<OlympusChampionDeckDialog championId="gennvim" onClose={vi.fn()} />);

    const cardButton = await screen.findByRole("button", { name: /Ver la ficha de Vanguardia Neón/i });
    fireEvent.click(cardButton);

    const detail = await screen.findByRole("dialog", { name: /Ficha de Vanguardia Neón/i });
    // El inspector completo, no la miniatura: título «Detalle» y la descripción legible.
    expect(within(detail).getByText("Detalle")).toBeInTheDocument();
    expect(within(detail).getAllByText(/Descripción de Vanguardia Neón/i).length).toBeGreaterThan(0);
  });

  it("Escape cierra primero la ficha y solo después el mazo", async () => {
    const onClose = vi.fn();
    render(<OlympusChampionDeckDialog championId="gennvim" onClose={onClose} />);

    fireEvent.click(await screen.findByRole("button", { name: /Ver la ficha de Kernel Táctico/i }));
    await screen.findByRole("dialog", { name: /Ficha de Kernel Táctico/i });

    // Nada de esperar a que la ficha desaparezca del DOM: su animación de salida puede quedarse a
    // medias bajo carga. Lo que importa es a quién cierra cada Escape.
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
