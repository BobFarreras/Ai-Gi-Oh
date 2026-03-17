// src/services/story/resolve-story-act-transition-node-id.test.ts - Verifica detección del nodo portal por acto activo.
import { describe, expect, it } from "vitest";
import { resolveStoryActTransitionNodeId } from "@/services/story/resolve-story-act-transition-node-id";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function node(id: string): IStoryMapNodeRuntime {
  return {
    id,
    chapter: 1,
    duelIndex: 1,
    title: id,
    opponentName: "Sistema",
    nodeType: "MOVE",
    difficulty: "ROOKIE",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    href: "#",
  };
}

describe("resolveStoryActTransitionNodeId", () => {
  it("encuentra el nodo portal del acto activo", () => {
    const id = resolveStoryActTransitionNodeId(
      [node("story-ch1-player-start"), node("story-ch1-transition-to-act2"), node("story-ch2-transition-to-act1")],
      1,
    );
    expect(id).toBe("story-ch1-transition-to-act2");
  });

  it("devuelve null si el acto no tiene nodo portal", () => {
    const id = resolveStoryActTransitionNodeId([node("story-ch1-player-start")], 2);
    expect(id).toBeNull();
  });
});
