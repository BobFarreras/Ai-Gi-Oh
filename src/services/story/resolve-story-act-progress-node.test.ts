// src/services/story/resolve-story-act-progress-node.test.ts - Verifica cómo se elige el nodo de reentrada por progreso dentro de un acto.
import { describe, expect, it } from "vitest";
import { resolveStoryActProgressNode } from "@/services/story/resolve-story-act-progress-node";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function n(input: Partial<IStoryMapNodeRuntime> & Pick<IStoryMapNodeRuntime, "id" | "duelIndex">): IStoryMapNodeRuntime {
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

describe("resolveStoryActProgressNode", () => {
  it("prioriza el último nodo visitado desbloqueado", () => {
    const actNodes = [n({ id: "a-1", duelIndex: 1 }), n({ id: "a-2", duelIndex: 2 }), n({ id: "a-3", duelIndex: 3, isUnlocked: false })];
    const result = resolveStoryActProgressNode({ actNodes, visitedNodeIds: ["a-1", "a-3", "a-2"] });
    expect(result).toBe("a-2");
  });

  it("usa el completado de mayor índice cuando no hay visitados válidos", () => {
    const actNodes = [n({ id: "a-1", duelIndex: 1, isCompleted: true }), n({ id: "a-2", duelIndex: 2, isCompleted: true }), n({ id: "a-3", duelIndex: 3 })];
    const result = resolveStoryActProgressNode({ actNodes, visitedNodeIds: [] });
    expect(result).toBe("a-2");
  });
});
