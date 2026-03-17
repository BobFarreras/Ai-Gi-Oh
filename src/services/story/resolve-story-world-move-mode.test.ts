// src/services/story/resolve-story-world-move-mode.test.ts - Verifica reglas de movimiento secuencial y retroceso en mapa Story.
import { describe, expect, it } from "vitest";
import { resolveStoryWorldMoveMode } from "@/services/story/resolve-story-world-move-mode";

describe("resolveStoryWorldMoveMode", () => {
  it("permite retroceso cuando el nodo ya fue visitado", () => {
    const result = resolveStoryWorldMoveMode({
      targetNodeId: "story-ch1-path-blank-1",
      currentNodeId: "story-ch1-reward-nexus-beta",
      visitedNodeIds: ["story-ch1-path-blank-1", "story-ch1-duel-1"],
      completedNodeIds: ["story-ch1-duel-1"],
      interactedNodeIds: [],
    });
    expect(result).toEqual({ mode: "VISITED", isAllowed: true, validationMessage: null });
  });

  it("bloquea salto hacia duelo visual si no viene del nodo anterior", () => {
    const result = resolveStoryWorldMoveMode({
      targetNodeId: "story-ch1-duel-1",
      currentNodeId: "story-ch1-player-start",
      visitedNodeIds: [],
      completedNodeIds: [],
      interactedNodeIds: [],
    });
    expect(result.mode).toBe("VISUAL");
    expect(result.isAllowed).toBe(false);
  });

  it("permite avanzar a nodo visual cuando se respeta secuencia", () => {
    const result = resolveStoryWorldMoveMode({
      targetNodeId: "story-ch1-path-lower-a",
      currentNodeId: "story-ch1-duel-1",
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
    expect(result).toEqual({ mode: "VIRTUAL", isAllowed: true, validationMessage: null });
  });

  it("bloquea salto a moneda sin resolver duelo y permite retroceso tras visitado", () => {
    const blockedJump = resolveStoryWorldMoveMode({
      targetNodeId: "story-ch1-reward-nexus-lower",
      currentNodeId: "story-ch1-path-blank-1",
      visitedNodeIds: ["story-ch1-player-start", "story-ch1-path-blank-1"],
      completedNodeIds: [],
      interactedNodeIds: [],
    });
    expect(blockedJump.mode).toBe("VIRTUAL");
    expect(blockedJump.isAllowed).toBe(false);

    const forwardAfterDuel = resolveStoryWorldMoveMode({
      targetNodeId: "story-ch1-reward-nexus-lower",
      currentNodeId: "story-ch1-duel-2",
      visitedNodeIds: [
        "story-ch1-player-start",
        "story-ch1-path-blank-1",
        "story-ch1-reward-card-alpha",
        "story-ch1-path-branch-1",
        "story-ch1-path-lower-a",
        "story-ch1-path-lower-b",
        "story-ch1-duel-2",
      ],
      completedNodeIds: ["story-ch1-duel-2"],
      interactedNodeIds: ["story-ch1-reward-card-alpha"],
    });
    expect(forwardAfterDuel.isAllowed).toBe(true);

    const backToStep = resolveStoryWorldMoveMode({
      targetNodeId: "story-ch1-path-blank-1",
      currentNodeId: "story-ch1-reward-nexus-lower",
      visitedNodeIds: [
        "story-ch1-player-start",
        "story-ch1-path-blank-1",
        "story-ch1-reward-card-alpha",
        "story-ch1-path-branch-1",
        "story-ch1-path-lower-a",
        "story-ch1-path-lower-b",
        "story-ch1-duel-2",
        "story-ch1-reward-nexus-lower",
      ],
      completedNodeIds: ["story-ch1-duel-2"],
      interactedNodeIds: ["story-ch1-reward-card-alpha", "story-ch1-reward-nexus-lower"],
    });
    expect(backToStep).toEqual({ mode: "VISITED", isAllowed: true, validationMessage: null });
  });

  it("permite moverse a duelo inferior y a nodos superiores visitados con estado real reportado", () => {
    const visitedNodeIds = [
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
    ];
    const interactedNodeIds = ["story-ch1-reward-card-alpha", "story-ch1-reward-nexus-upper"];
    const completedNodeIds = ["story-ch1-duel-1"];

    const lowerDuel = resolveStoryWorldMoveMode({
      targetNodeId: "story-ch1-duel-2",
      currentNodeId: "story-ch1-path-lower-a",
      visitedNodeIds,
      completedNodeIds,
      interactedNodeIds,
    });
    expect(lowerDuel.isAllowed).toBe(true);

    const upperVisitedNode = resolveStoryWorldMoveMode({
      targetNodeId: "story-ch1-reward-nexus-upper",
      currentNodeId: "story-ch1-path-lower-a",
      visitedNodeIds,
      completedNodeIds,
      interactedNodeIds,
    });
    expect(upperVisitedNode).toEqual({ mode: "VISITED", isAllowed: true, validationMessage: null });
  });
});
