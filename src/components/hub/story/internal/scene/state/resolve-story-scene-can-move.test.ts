// src/components/hub/story/internal/scene/state/resolve-story-scene-can-move.test.ts - Prueba reglas de habilitación del botón de movimiento Story.
import { describe, expect, it } from "vitest";
import { resolveStorySceneCanMove } from "./resolve-story-scene-can-move";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function createNode(overrides: Partial<IStoryMapNodeRuntime>): IStoryMapNodeRuntime {
  return {
    id: "story-node",
    chapter: 1,
    duelIndex: 1,
    title: "Nodo",
    opponentName: "Sistema",
    nodeType: "DUEL",
    difficulty: "STANDARD",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    href: "#",
    unlockRequirementNodeId: null,
    ...overrides,
  };
}

describe("resolveStorySceneCanMove", () => {
  it("permite moverse a una plataforma vacía completada aunque fuera virtual", () => {
    const canMove = resolveStorySceneCanMove({
      selectedNode: createNode({
        id: "story-ch1-reward-nexus-beta",
        nodeType: "REWARD_NEXUS",
        isVirtualNode: true,
        isCompleted: true,
      }),
      currentNodeId: "story-ch1-duel-1",
      isInteracting: false,
      isDialogOpen: false,
    });
    expect(canMove).toBe(true);
  });

  it("permite moverse a nodo virtual de recompensa desbloqueado", () => {
    const canMove = resolveStorySceneCanMove({
      selectedNode: createNode({
        id: "story-ch1-reward-nexus-beta",
        nodeType: "REWARD_NEXUS",
        isVirtualNode: true,
        isCompleted: false,
        isUnlocked: true,
      }),
      currentNodeId: "story-ch1-duel-1",
      isInteracting: false,
      isDialogOpen: false,
    });
    expect(canMove).toBe(true);
  });

  it("bloquea movimiento si el nodo seleccionado es el actual", () => {
    const canMove = resolveStorySceneCanMove({
      selectedNode: createNode({ id: "story-ch1-path-blank-1", nodeType: "MOVE" }),
      currentNodeId: "story-ch1-path-blank-1",
      isInteracting: false,
      isDialogOpen: false,
    });
    expect(canMove).toBe(false);
  });

  it("bloquea movimiento para nodos de duelo y boss", () => {
    const duelMove = resolveStorySceneCanMove({
      selectedNode: createNode({ id: "story-ch1-duel-1", nodeType: "DUEL", isUnlocked: true }),
      currentNodeId: "story-ch1-path-blank-1",
      isInteracting: false,
      isDialogOpen: false,
    });
    const bossMove = resolveStorySceneCanMove({
      selectedNode: createNode({ id: "story-ch1-boss-1", nodeType: "BOSS", isUnlocked: true }),
      currentNodeId: "story-ch1-event-1",
      isInteracting: false,
      isDialogOpen: false,
    });
    expect(duelMove).toBe(false);
    expect(bossMove).toBe(false);
  });

  it("permite movimiento cuando un nodo de duelo ya fue completado", () => {
    const canMove = resolveStorySceneCanMove({
      selectedNode: createNode({ id: "story-ch1-duel-1", nodeType: "DUEL", isCompleted: true, isUnlocked: true }),
      currentNodeId: "story-ch1-path-blank-1",
      isInteracting: false,
      isDialogOpen: false,
    });
    expect(canMove).toBe(true);
  });
});
