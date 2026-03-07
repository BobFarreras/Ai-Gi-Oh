// src/components/hub/home/layout/HomeResponsiveWorkspace.test.tsx - Verifica que el router visual del Arsenal monta layout desktop y mobile.
import { render, screen } from "@testing-library/react";
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
    },
    collectionState: [],
    filteredCollection: [],
    cardProgressById: new Map(),
    evolvableCardIds: new Set(),
    selectedSlotIndex: null,
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
    onSelectCollectionCard: vi.fn(),
    onClearError: vi.fn(),
  };
}

describe("HomeResponsiveWorkspace", () => {
  it("monta los dos layouts y delega el responsive por CSS", () => {
    render(<HomeResponsiveWorkspace {...createProps()} />);
    expect(screen.getByTestId("arsenal-desktop-layout")).toBeInTheDocument();
    expect(screen.getByTestId("arsenal-mobile-layout")).toBeInTheDocument();
  });
});
