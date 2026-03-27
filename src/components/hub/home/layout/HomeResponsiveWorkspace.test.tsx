// src/components/hub/home/layout/HomeResponsiveWorkspace.test.tsx - Verifica selección exclusiva de layout desktop/mobile según viewport.
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeResponsiveWorkspace } from "@/components/hub/home/layout/HomeResponsiveWorkspace";
import { IHomeWorkspaceProps } from "@/components/hub/home/layout/home-workspace-types";

vi.mock("@/components/hub/home/layout/HomeDesktopWorkspace", () => ({
  HomeDesktopWorkspace: () => <div data-testid="arsenal-desktop-layout">Desktop Layout</div>,
}));

vi.mock("@/components/hub/home/layout/HomeMobileWorkspace", () => ({
  HomeMobileWorkspace: () => <div data-testid="arsenal-mobile-layout">Mobile Layout</div>,
}));

function createProps(): IHomeWorkspaceProps {
  return {
    deck: {
      playerId: "player-1",
      slots: Array.from({ length: 20 }, (_, index) => ({ index, cardId: null })),
      fusionSlots: [
        { index: 0, cardId: null },
        { index: 1, cardId: null },
      ],
    },
    collectionState: [],
    filteredCollection: [],
    cardProgressById: new Map(),
    evolvableCardIds: new Set(),
    selectedSlotIndex: null,
    selectedFusionSlotIndex: null,
    selectedCardId: null,
    selectedCollectionCardId: null,
    selectedCard: null,
    selectedCardVersionTier: 0,
    selectedCardLevel: 0,
    selectedCardXp: 0,
    selectedCardMasteryPassiveSkillId: null,
    nameQuery: "",
    typeFilter: "ALL",
    canInsertSelectedCard: false,
    canRemoveSelectedCard: false,
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

describe("HomeResponsiveWorkspace", () => {
  it("renderiza desktop para resoluciones >= 900", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 1200 });
    render(<HomeResponsiveWorkspace {...createProps()} />);
    expect(screen.getByTestId("arsenal-desktop-layout")).toBeInTheDocument();
    expect(screen.queryByTestId("arsenal-mobile-layout")).not.toBeInTheDocument();
  });

  it("renderiza mobile para resoluciones < 900", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 899 });
    render(<HomeResponsiveWorkspace {...createProps()} />);
    expect(screen.getByTestId("arsenal-mobile-layout")).toBeInTheDocument();
    expect(screen.queryByTestId("arsenal-desktop-layout")).not.toBeInTheDocument();
  });

  it("actualiza el layout al redimensionar", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 899 });
    render(<HomeResponsiveWorkspace {...createProps()} />);
    expect(screen.getByTestId("arsenal-mobile-layout")).toBeInTheDocument();

    act(() => {
      window.innerWidth = 1280;
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByTestId("arsenal-desktop-layout")).toBeInTheDocument();
    expect(screen.queryByTestId("arsenal-mobile-layout")).not.toBeInTheDocument();
  });
});
