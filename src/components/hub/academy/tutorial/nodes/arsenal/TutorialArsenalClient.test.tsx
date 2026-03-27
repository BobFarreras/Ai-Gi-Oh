// src/components/hub/academy/tutorial/nodes/arsenal/TutorialArsenalClient.test.tsx - Verifica flujo guiado de Preparar Deck sobre el layout real de Arsenal.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TutorialArsenalClient } from "@/components/hub/academy/tutorial/nodes/arsenal/TutorialArsenalClient";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";

vi.mock("@/components/hub/home/HomeDeckActionBar", () => ({
  HomeDeckActionBar: (props: { onInsert: () => Promise<unknown>; onRemove: () => Promise<unknown>; onEvolve: () => Promise<unknown> }) => (
    <div>
      <button type="button" data-tutorial-id="tutorial-home-add-button" onClick={() => void props.onInsert()}>Añadir</button>
      <button type="button" data-tutorial-id="tutorial-home-remove-button" onClick={() => void props.onRemove()}>Remover</button>
      <button type="button" data-tutorial-id="tutorial-home-evolve-button" onClick={() => void props.onEvolve()}>Evolucionar</button>
    </div>
  ),
}));

vi.mock("@/components/hub/home/layout/HomeResponsiveWorkspace", () => ({
  HomeResponsiveWorkspace: (props: {
    onSelectSlot: (index: number) => void;
    onSelectCollectionCard: (cardId: string) => void;
  }) => (
    <div>
      <button type="button" data-tutorial-id="tutorial-home-deck" onClick={() => props.onSelectSlot(0)}>Deck slot</button>
      <button type="button" data-tutorial-id="tutorial-home-collection" onClick={() => props.onSelectCollectionCard("mock-evolve-spark")}>Colección</button>
      <div data-tutorial-id="tutorial-home-inspector">Inspector</div>
      <div data-tutorial-id="tutorial-home-fusion-block">Fusion</div>
    </div>
  ),
}));

vi.mock("@/components/hub/internal/HubErrorDialog", () => ({ HubErrorDialog: () => null }));
vi.mock("@/components/hub/home/HomeEvolutionOverlay", () => ({ HomeEvolutionOverlay: () => null }));

describe("TutorialArsenalClient", () => {
  it("muestra intro y permite avanzar por los pasos del nodo", () => {
    const deck = { playerId: "p1", slots: [{ index: 0, cardId: "mock-material-a" }], fusionSlots: [{ index: 0, cardId: "mock-fusion-core" }, { index: 1, cardId: null }] };
    const collection: ICollectionCard[] = [{
      card: { id: "mock-evolve-spark", name: "Spark", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 1, attack: 1000, defense: 1000 },
      ownedCopies: 10,
    }];
    render(<TutorialArsenalClient playerId="p1" initialDeck={deck} collection={collection} initialCardProgress={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));
    expect(screen.getByText("Selecciona carta del almacén")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Colección" }));
    expect(screen.getByText("Lee el detalle antes de actuar")).toBeInTheDocument();
  });
});
