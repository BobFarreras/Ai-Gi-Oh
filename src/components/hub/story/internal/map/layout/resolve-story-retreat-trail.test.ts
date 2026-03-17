// src/components/hub/story/internal/map/layout/resolve-story-retreat-trail.test.ts - Verifica que la retirada rival siga el grafo Story hasta su hoja final.
import { describe, expect, it } from "vitest";
import { resolveStoryRetreatTrail } from "./resolve-story-retreat-trail";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function node(input: Partial<IStoryMapNodeRuntime> & Pick<IStoryMapNodeRuntime, "id">): IStoryMapNodeRuntime {
  return {
    id: input.id,
    chapter: 1,
    duelIndex: input.duelIndex ?? 1,
    title: input.title ?? input.id,
    opponentName: "Sistema",
    nodeType: input.nodeType ?? "MOVE",
    difficulty: "ROOKIE",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    unlockRequirementNodeId: input.unlockRequirementNodeId ?? null,
    href: "/hub/story",
    position: input.position ?? { x: 0, y: 0 },
    pathLinkFromNodeIds: input.pathLinkFromNodeIds,
  };
}

describe("resolveStoryRetreatTrail", () => {
  it("devuelve trayectoria hasta el último descendiente en línea recta", () => {
    const nodes = [
      node({ id: "duel", position: { x: 100, y: 200 } }),
      node({ id: "reward", unlockRequirementNodeId: "duel", position: { x: 300, y: 200 } }),
      node({ id: "boss", unlockRequirementNodeId: "reward", position: { x: 500, y: 200 } }),
    ];
    const trail = resolveStoryRetreatTrail({
      retreatingNodeId: "duel",
      nodes,
      positionMap: { duel: { x: 100, y: 200 }, reward: { x: 300, y: 200 }, boss: { x: 500, y: 200 } },
    });
    expect(trail).toEqual([
      { x: 100, y: 208 },
      { x: 300, y: 208 },
      { x: 500, y: 208 },
    ]);
  });

  it("cuando hay ramas elige la de mayor avance horizontal", () => {
    const nodes = [
      node({ id: "duel", position: { x: 100, y: 200 } }),
      node({ id: "upper", unlockRequirementNodeId: "duel", position: { x: 260, y: 100 } }),
      node({ id: "lower", unlockRequirementNodeId: "duel", position: { x: 220, y: 280 } }),
    ];
    const trail = resolveStoryRetreatTrail({
      retreatingNodeId: "duel",
      nodes,
      positionMap: { duel: { x: 100, y: 200 }, upper: { x: 260, y: 100 }, lower: { x: 220, y: 280 } },
    });
    expect(trail[1]).toEqual({ x: 260, y: 108 });
  });
});
