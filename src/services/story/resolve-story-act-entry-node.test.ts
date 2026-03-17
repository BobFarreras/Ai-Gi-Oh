// src/services/story/resolve-story-act-entry-node.test.ts - Valida el criterio de entrada por acto según cambio hacia delante o atrás.
import { describe, expect, it } from "vitest";
import { resolveStoryActEntryNode } from "@/services/story/resolve-story-act-entry-node";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function node(input: Partial<IStoryMapNodeRuntime> & Pick<IStoryMapNodeRuntime, "id" | "duelIndex">): IStoryMapNodeRuntime {
  const { id, duelIndex, ...rest } = input;
  return {
    id,
    chapter: 2,
    duelIndex,
    title: input.title ?? id,
    opponentName: "Sistema",
    nodeType: "MOVE",
    difficulty: "ROOKIE",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    href: "#",
    ...rest,
  };
}

describe("resolveStoryActEntryNode", () => {
  it("al avanzar de acto entra por la plataforma inicial", () => {
    const entryNodeId = resolveStoryActEntryNode({
      preferredActId: 2,
      activeActId: 2,
      currentActId: 1,
      actStartNodeId: "story-ch2-player-start",
      actNodes: [node({ id: "story-ch2-player-start", duelIndex: 1 })],
      visitedNodeIds: ["story-ch2-duel-1"],
      effectiveCurrentNodeId: "story-ch1-transition-to-act2",
    });

    expect(entryNodeId).toBe("story-ch2-player-start");
  });

  it("al volver a un acto previo recupera el último nodo progresado", () => {
    const actNodes = [
      node({ id: "story-ch1-player-start", duelIndex: 1 }),
      node({ id: "story-ch1-path-upper-a", duelIndex: 2 }),
      node({ id: "story-ch1-duel-1", duelIndex: 3 }),
    ];
    const entryNodeId = resolveStoryActEntryNode({
      preferredActId: 1,
      activeActId: 1,
      currentActId: 2,
      actStartNodeId: "story-ch1-player-start",
      actNodes,
      visitedNodeIds: ["story-ch1-player-start", "story-ch1-path-upper-a"],
      effectiveCurrentNodeId: "story-ch2-transition-to-act1",
    });

    expect(entryNodeId).toBe("story-ch1-path-upper-a");
  });
});
