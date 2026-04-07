// src/services/story/resolve-story-world-traversal-path.test.ts - Pruebas de pathfinding Story para desplazamiento nodo a nodo sin saltos visuales.
import { describe, expect, it } from "vitest";
import { resolveStoryWorldTraversalPath } from "@/services/story/resolve-story-world-traversal-path";

describe("resolveStoryWorldTraversalPath", () => {
  it("permite volver al nodo de retorno del acto 2 cuando existe conexión al inicio del acto", () => {
    const path = resolveStoryWorldTraversalPath({
      currentNodeId: "story-ch2-event-core",
      targetNodeId: "story-ch2-transition-to-act1",
      visitedNodeIds: [
        "story-ch2-player-start",
        "story-ch2-path-entry",
        "story-ch2-path-blank-a",
        "story-ch2-reward-nexus-a",
        "story-ch2-event-core",
      ],
      completedNodeIds: [],
      interactedNodeIds: ["story-ch2-reward-nexus-a", "story-ch2-event-core"],
    });
    expect(path).toEqual([
      "story-ch2-event-core",
      "story-ch2-reward-nexus-a",
      "story-ch2-path-blank-a",
      "story-ch2-path-entry",
      "story-ch2-player-start",
      "story-ch2-transition-to-act1",
    ]);
  });

  it("resuelve ruta de rama secundaria a principal pasando por nodos intermedios", () => {
    const path = resolveStoryWorldTraversalPath({
      currentNodeId: "story-a1-side-move-scraper-path",
      targetNodeId: "story-a1-reward-nexus-cache",
      visitedNodeIds: [
        "story-ch1-player-start",
        "story-a1-event-biglog-briefing",
        "story-a1-move-transit",
        "story-a1-side-event-echo-fragment",
        "story-a1-side-move-scraper-path",
      ],
      completedNodeIds: [],
      interactedNodeIds: ["story-a1-event-biglog-briefing", "story-a1-side-event-echo-fragment"],
    });
    expect(path).toEqual([
      "story-a1-side-move-scraper-path",
      "story-a1-side-event-echo-fragment",
      "story-a1-move-transit",
      "story-a1-reward-nexus-cache",
    ]);
  });

  it("bloquea ruta si requiere pasar por duelo no resuelto", () => {
    const path = resolveStoryWorldTraversalPath({
      currentNodeId: "story-a1-reward-nexus-cache",
      targetNodeId: "story-a1-reward-card-guardian",
      visitedNodeIds: ["story-a1-reward-nexus-cache", "story-a1-event-special-card-signal"],
      completedNodeIds: [],
      interactedNodeIds: ["story-a1-event-special-card-signal"],
    });
    expect(path).toBeNull();
  });

  it("resuelve ruta hacia duelo de la rama secundaria", () => {
    const path = resolveStoryWorldTraversalPath({
      currentNodeId: "story-a1-side-event-echo-fragment",
      targetNodeId: "story-ch1-duel-2",
      visitedNodeIds: [
        "story-ch1-player-start",
        "story-a1-event-biglog-briefing",
        "story-a1-move-transit",
        "story-a1-side-event-echo-fragment",
        "story-a1-side-move-scraper-path",
      ],
      completedNodeIds: [],
      interactedNodeIds: ["story-a1-event-biglog-briefing", "story-a1-side-event-echo-fragment"],
    });
    expect(path).toEqual(["story-a1-side-event-echo-fragment", "story-a1-side-move-scraper-path", "story-ch1-duel-2"]);
  });

  it("bloquea avance a evento cuando la recompensa previa no fue interactuada", () => {
    const path = resolveStoryWorldTraversalPath({
      currentNodeId: "story-a1-reward-nexus-cache",
      targetNodeId: "story-a1-event-special-card-signal",
      visitedNodeIds: ["story-ch1-player-start", "story-a1-event-biglog-briefing", "story-a1-move-transit", "story-a1-reward-nexus-cache"],
      completedNodeIds: [],
      interactedNodeIds: ["story-a1-event-biglog-briefing"],
    });
    expect(path).toBeNull();
  });
});
