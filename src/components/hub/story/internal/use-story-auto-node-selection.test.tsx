// src/components/hub/story/internal/use-story-auto-node-selection.test.tsx - Verifica auto-acciones al seleccionar nodos Story en mapa.
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStoryAutoNodeSelection } from "@/components/hub/story/internal/use-story-auto-node-selection";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function createNode(overrides: Partial<IStoryMapNodeRuntime> = {}): IStoryMapNodeRuntime {
  return {
    id: "story-ch1-duel-1",
    chapter: 1,
    duelIndex: 1,
    title: "Nodo",
    opponentName: "NPC",
    nodeType: "DUEL",
    difficulty: "ROOKIE",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    unlockRequirementNodeId: null,
    href: "/hub/story/chapter/1/duel/1",
    ...overrides,
  };
}

describe("useStoryAutoNodeSelection", () => {
  it("dispara auto-move en nodos no virtuales desbloqueados", () => {
    const onAutoMove = vi.fn();
    const onAutoInteract = vi.fn();
    renderHook(() =>
      useStoryAutoNodeSelection({
        selectedNode: createNode({ id: "story-ch1-duel-2" }),
        currentNodeId: "story-ch1-duel-1",
        isBusy: false,
        onAutoMove,
        onAutoInteract,
      }),
    );

    expect(onAutoMove).toHaveBeenCalledTimes(1);
    expect(onAutoInteract).not.toHaveBeenCalled();
  });

  it("dispara auto-interaction en nodos virtuales", () => {
    const onAutoMove = vi.fn();
    const onAutoInteract = vi.fn();
    renderHook(() =>
      useStoryAutoNodeSelection({
        selectedNode: createNode({ id: "story-ch1-event-briefing", isVirtualNode: true, href: "#", nodeType: "EVENT" }),
        currentNodeId: "story-ch1-duel-1",
        isBusy: false,
        onAutoMove,
        onAutoInteract,
      }),
    );

    expect(onAutoInteract).toHaveBeenCalledTimes(1);
    expect(onAutoMove).not.toHaveBeenCalled();
  });

  it("no dispara interacción automática en nodo virtual de movimiento", () => {
    const onAutoMove = vi.fn();
    const onAutoInteract = vi.fn();
    renderHook(() =>
      useStoryAutoNodeSelection({
        selectedNode: createNode({ id: "story-ch1-player-start", isVirtualNode: true, href: "#", nodeType: "MOVE" }),
        currentNodeId: null,
        isBusy: false,
        onAutoMove,
        onAutoInteract,
      }),
    );

    expect(onAutoMove).not.toHaveBeenCalled();
    expect(onAutoInteract).not.toHaveBeenCalled();
  });
});
