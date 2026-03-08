// src/components/hub/home/layout/HomeMobileWorkspace.test.tsx - Valida tabs mobile del Arsenal y apertura del inspector al seleccionar carta.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeMobileWorkspace } from "@/components/hub/home/layout/HomeMobileWorkspace";
import { IHomeWorkspaceProps } from "@/components/hub/home/layout/home-workspace-types";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";

vi.mock("@/components/hub/home/HomeMiniCard", () => ({
  HomeMiniCard: ({ label, onClick }: { label: string; onClick?: () => void }) => (
    onClick ? (
      <button type="button" aria-label={label} onClick={onClick}>
        {label}
      </button>
    ) : (
      <div aria-label={label}>{label}</div>
    )
  ),
}));

vi.mock("@/components/hub/home/HomeCardInspectorDialog", () => ({
  HomeCardInspectorDialog: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="home-mobile-inspector-state">{isOpen ? "open" : "closed"}</div>
  ),
}));

function createProps(): IHomeWorkspaceProps {
  const collection: ICollectionCard[] = [
    {
      card: {
        id: "entity-python",
        name: "Python",
        description: "Carta test",
        type: "ENTITY",
        faction: "NEUTRAL",
        cost: 2,
        attack: 1000,
        defense: 1000,
      },
      ownedCopies: 2,
    },
  ];
  return {
    deck: {
      playerId: "player-1",
      slots: [{ index: 0, cardId: "entity-python" }, ...Array.from({ length: 19 }, (_, index) => ({ index: index + 1, cardId: null }))],
      fusionSlots: [
        { index: 0, cardId: null },
        { index: 1, cardId: null },
      ],
    },
    collectionState: collection,
    filteredCollection: collection,
    cardProgressById: new Map(),
    evolvableCardIds: new Set(),
    selectedSlotIndex: null,
    selectedFusionSlotIndex: null,
    selectedCardId: "entity-python",
    selectedCollectionCardId: null,
    selectedCard: null,
    selectedCardVersionTier: 0,
    selectedCardLevel: 0,
    selectedCardXp: 0,
    selectedCardMasteryPassiveSkillId: null,
    nameQuery: "",
    typeFilter: "ALL",
    canInsertSelectedCard: true,
    canRemoveSelectedCard: true,
    canEvolveSelectedCard: false,
    evolveCostForSelectedCard: null,
    onInsertSelectedCard: vi.fn(async () => ({ ok: true })),
    onRemoveSelectedCard: vi.fn(async () => ({ ok: true })),
    onEvolveSelectedCard: vi.fn(async () => ({ ok: true })),
    onSelectSlot: vi.fn(),
    onSelectFusionSlot: vi.fn(),
    onSelectCollectionCard: vi.fn(),
    onStartDragCollectionCard: vi.fn(),
    onStartDragDeckSlot: vi.fn(),
    onStartDragFusionSlot: vi.fn(),
    onDropOnDeckSlot: vi.fn(),
    onDropOnFusionSlot: vi.fn(),
    onDropOnCollectionArea: vi.fn(),
    onClearError: vi.fn(),
  };
}

describe("HomeMobileWorkspace", () => {
  it("cambia entre tabs Deck y Almacén", () => {
    render(<HomeMobileWorkspace {...createProps()} />);
    expect(screen.getByRole("heading", { name: "Deck Activo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Almacén" }));
    expect(screen.getByRole("heading", { name: "Almacén" })).toBeInTheDocument();
  });

  it("abre inspector al seleccionar slot con carta", () => {
    render(<HomeMobileWorkspace {...createProps()} />);
    expect(screen.getByTestId("home-mobile-inspector-state")).toHaveTextContent("closed");
    fireEvent.click(screen.getByRole("button", { name: "Slot 1" }));
    expect(screen.getByTestId("home-mobile-inspector-state")).toHaveTextContent("open");
  });

  it("abre inspector al seleccionar carta de colección", () => {
    render(<HomeMobileWorkspace {...createProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "Almacén" }));
    fireEvent.click(screen.getByRole("button", { name: "Carta Python" }));
    expect(screen.getByTestId("home-mobile-inspector-state")).toHaveTextContent("open");
  });
});
