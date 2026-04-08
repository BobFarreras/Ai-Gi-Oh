// src/services/story/resolve-story-world-move-mode.test.ts - Verifica reglas de movimiento secuencial y retroceso en mapa Story.
import { describe, expect, it } from "vitest";
import { resolveStoryWorldMoveMode } from "@/services/story/resolve-story-world-move-mode";

describe("resolveStoryWorldMoveMode", () => {
  it("permite retroceso cuando el nodo ya fue visitado", () => {
    const result = resolveStoryWorldMoveMode({
      targetNodeId: "story-a1-move-transit",
      currentNodeId: "story-a1-reward-nexus-cache",
      visitedNodeIds: ["story-a1-move-transit", "story-a1-reward-nexus-cache"],
      completedNodeIds: [],
      interactedNodeIds: ["story-a1-event-biglog-briefing"],
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

  it("permite avanzar a nodo virtual cuando se respeta secuencia", () => {
    const result = resolveStoryWorldMoveMode({
      targetNodeId: "story-a1-reward-nexus-cache",
      currentNodeId: "story-a1-move-transit",
      visitedNodeIds: ["story-ch1-player-start", "story-a1-event-biglog-briefing", "story-a1-move-transit"],
      completedNodeIds: [],
      interactedNodeIds: ["story-a1-event-biglog-briefing"],
    });
    expect(result).toEqual({ mode: "VIRTUAL", isAllowed: true, validationMessage: null });
  });

  it("bloquea salto a recompensa lateral sin resolver duelo y permite retroceso tras visitado", () => {
    const blockedJump = resolveStoryWorldMoveMode({
      targetNodeId: "story-a1-side-reward-card",
      currentNodeId: "story-a1-side-move-scraper-path",
      visitedNodeIds: ["story-a1-side-move-scraper-path"],
      completedNodeIds: [],
      interactedNodeIds: [],
    });
    expect(blockedJump.mode).toBe("VIRTUAL");
    expect(blockedJump.isAllowed).toBe(false);

    const forwardAfterDuel = resolveStoryWorldMoveMode({
      targetNodeId: "story-a1-side-reward-card",
      currentNodeId: "story-ch1-duel-2",
      visitedNodeIds: ["story-a1-side-event-echo-fragment", "story-a1-side-move-scraper-path", "story-ch1-duel-2"],
      completedNodeIds: ["story-ch1-duel-2"],
      interactedNodeIds: ["story-a1-side-event-echo-fragment"],
    });
    expect(forwardAfterDuel.isAllowed).toBe(true);

    const backToStep = resolveStoryWorldMoveMode({
      targetNodeId: "story-a1-side-move-scraper-path",
      currentNodeId: "story-a1-side-reward-card",
      visitedNodeIds: ["story-a1-side-move-scraper-path", "story-ch1-duel-2", "story-a1-side-reward-card"],
      completedNodeIds: ["story-ch1-duel-2"],
      interactedNodeIds: ["story-a1-side-reward-card"],
    });
    expect(backToStep).toEqual({ mode: "VISITED", isAllowed: true, validationMessage: null });
  });
});
