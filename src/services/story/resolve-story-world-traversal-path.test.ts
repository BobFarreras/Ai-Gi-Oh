// src/services/story/resolve-story-world-traversal-path.test.ts - Pruebas de pathfinding Story para desplazamiento nodo a nodo sin saltos visuales.
import { describe, expect, it } from "vitest";
import { resolveStoryWorldTraversalPath } from "@/services/story/resolve-story-world-traversal-path";

describe("resolveStoryWorldTraversalPath", () => {
  it("resuelve ruta de rama superior a inferior pasando por nodos intermedios", () => {
    const path = resolveStoryWorldTraversalPath({
      currentNodeId: "story-ch1-duel-1",
      targetNodeId: "story-ch1-path-lower-a",
      visitedNodeIds: [
        "story-ch1-player-start",
        "story-ch1-path-blank-1",
        "story-ch1-reward-card-alpha",
        "story-ch1-path-branch-1",
        "story-ch1-path-upper-a",
        "story-ch1-duel-1",
      ],
      completedNodeIds: ["story-ch1-duel-1"],
      interactedNodeIds: ["story-ch1-reward-card-alpha"],
    });
    expect(path).toEqual([
      "story-ch1-duel-1",
      "story-ch1-path-upper-a",
      "story-ch1-path-branch-1",
      "story-ch1-path-lower-a",
    ]);
  });

  it("bloquea ruta si requiere pasar por duelo no resuelto", () => {
    const path = resolveStoryWorldTraversalPath({
      currentNodeId: "story-ch1-path-branch-1",
      targetNodeId: "story-ch1-reward-nexus-upper",
      visitedNodeIds: ["story-ch1-path-branch-1", "story-ch1-path-upper-a"],
      completedNodeIds: [],
      interactedNodeIds: [],
    });
    expect(path).toBeNull();
  });

  it("resuelve ruta hacia duelo inferior con estado real reportado", () => {
    const path = resolveStoryWorldTraversalPath({
      currentNodeId: "story-ch1-path-lower-a",
      targetNodeId: "story-ch1-duel-2",
      visitedNodeIds: [
        "story-ch1-player-start",
        "story-ch1-path-blank-1",
        "story-ch1-reward-card-alpha",
        "story-ch1-path-branch-1",
        "story-ch1-path-upper-a",
        "story-ch1-duel-1",
        "story-ch1-duel-2",
        "story-ch1-reward-nexus-upper",
        "story-ch1-path-lower-a",
        "story-ch1-path-lower-b",
      ],
      completedNodeIds: ["story-ch1-duel-1"],
      interactedNodeIds: ["story-ch1-reward-card-alpha", "story-ch1-reward-nexus-upper"],
    });
    expect(path).toEqual(["story-ch1-path-lower-a", "story-ch1-path-lower-b", "story-ch1-duel-2"]);
  });

  it("bloquea avance al evento del acto 2 si la recompensa previa no fue interactuada", () => {
    const path = resolveStoryWorldTraversalPath({
      currentNodeId: "story-ch2-reward-nexus-a",
      targetNodeId: "story-ch2-event-core",
      visitedNodeIds: [
        "story-ch2-player-start",
        "story-ch2-path-entry",
        "story-ch2-path-blank-a",
        "story-ch2-reward-nexus-a",
      ],
      completedNodeIds: [],
      interactedNodeIds: [],
    });
    expect(path).toBeNull();
  });
});
