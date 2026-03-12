// src/components/hub/story/StoryScene.test.tsx - Verifica selección de nodo desbloqueado y render de panel lateral Story.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoryScene } from "./StoryScene";
import { IStoryMapRuntimeData, IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function createMockNode(overrides: Partial<IStoryMapNodeRuntime>): IStoryMapNodeRuntime {
  return {
    id: "story-ch1-duel-1",
    chapter: 1,
    duelIndex: 1,
    title: "Nodo Test",
    opponentName: "Test Opponent",
    nodeType: "DUEL",
    difficulty: "STANDARD",
    rewardNexus: 100,
    rewardPlayerExperience: 50,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    href: "/hub/story/chapter/1/duel/1",
    unlockRequirementNodeId: null,
    ...overrides,
  };
}

const mockRuntime: IStoryMapRuntimeData = {
  playerId: "player-1",
  currentNodeId: "story-ch1-duel-1",
  nodes: [
    createMockNode({ id: "story-ch1-duel-1", nodeType: "MOVE", isCompleted: true }),
    createMockNode({ id: "story-ch1-duel-2", title: "Nodo Objetivo", unlockRequirementNodeId: "story-ch1-duel-1" }),
  ],
};

const mockBriefing: IStoryChapterBriefing = {
  chapter: 1,
  arcTitle: "Acto 1 · Tests",
  objective: "Validar render de escena.",
  tension: "DOM bajo vigilancia.",
};

describe("StoryScene", () => {
  it("selecciona nodo desbloqueado y muestra datos en sidebar", () => {
    render(<StoryScene runtime={mockRuntime} briefing={mockBriefing} />);
    const targetNode = screen.getByRole("button", { name: "Seleccionar nodo story-ch1-duel-2" });
    fireEvent.click(targetNode);
    expect(screen.getByText("Nodo Objetivo")).toBeInTheDocument();
  });
});
