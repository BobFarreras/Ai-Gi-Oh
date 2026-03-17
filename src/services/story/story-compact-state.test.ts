// src/services/story/story-compact-state.test.ts - Pruebas de actualización de estado compacto Story.
import { describe, expect, it } from "vitest";
import {
  applyStoryInteractionToCompactState,
  applyStoryMoveToCompactState,
  applyStoryTraversalToCompactState,
} from "@/services/story/story-compact-state";

describe("story-compact-state", () => {
  it("agrega visitados al mover y evita duplicados", () => {
    const next = applyStoryMoveToCompactState({
      state: {
        currentNodeId: "story-ch1-player-start",
        visitedNodeIds: ["story-ch1-player-start"],
        interactedNodeIds: [],
      },
      fromNodeId: "story-ch1-player-start",
      targetNodeId: "story-ch1-path-blank-1",
    });
    expect(next.currentNodeId).toBe("story-ch1-path-blank-1");
    expect(next.visitedNodeIds).toEqual(["story-ch1-player-start", "story-ch1-path-blank-1"]);
  });

  it("marca interacción sin perder visitados", () => {
    const next = applyStoryInteractionToCompactState({
      state: {
        currentNodeId: "story-ch1-duel-1",
        visitedNodeIds: ["story-ch1-player-start", "story-ch1-duel-1"],
        interactedNodeIds: [],
      },
      nodeId: "story-ch1-reward-nexus-beta",
    });
    expect(next.currentNodeId).toBe("story-ch1-reward-nexus-beta");
    expect(next.interactedNodeIds).toEqual(["story-ch1-reward-nexus-beta"]);
    expect(next.visitedNodeIds).toContain("story-ch1-reward-nexus-beta");
  });

  it("registra todos los nodos recorridos durante una travesía", () => {
    const next = applyStoryTraversalToCompactState({
      state: {
        currentNodeId: "story-ch1-duel-1",
        visitedNodeIds: ["story-ch1-player-start", "story-ch1-duel-1"],
        interactedNodeIds: [],
      },
      fromNodeId: "story-ch1-duel-1",
      traversedNodeIds: ["story-ch1-path-upper-a", "story-ch1-path-branch-1", "story-ch1-path-lower-a"],
    });
    expect(next.currentNodeId).toBe("story-ch1-path-lower-a");
    expect(next.visitedNodeIds).toEqual([
      "story-ch1-player-start",
      "story-ch1-duel-1",
      "story-ch1-path-upper-a",
      "story-ch1-path-branch-1",
      "story-ch1-path-lower-a",
    ]);
  });
});
