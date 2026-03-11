// src/components/hub/story/internal/map/layout/story-circuit-layout.test.ts - Verifica prioridad de posición explícita y segmentos en layout Story.
import { describe, expect, it } from "vitest";
import {
  buildStoryNodePositionMap,
  resolveStoryNodePlatformAnchor,
  resolveStoryNodeTokenAnchor,
  resolveStoryPathSegments,
} from "@/components/hub/story/internal/map/layout/story-circuit-layout";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { listStoryActMapDefinitions } from "@/services/story/map-definitions/story-map-definition-registry";

function buildNode(id: string, unlockRequirementNodeId: string | null, position?: { x: number; y: number }): IStoryMapNodeRuntime {
  return {
    id,
    chapter: 1,
    duelIndex: 1,
    title: id,
    opponentName: "Opponent",
    nodeType: "DUEL",
    difficulty: "ROOKIE",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    unlockRequirementNodeId,
    href: "/hub/story/chapter/1/duel/1",
    position,
  };
}

describe("buildStoryNodePositionMap", () => {
  it("prioriza coordenadas explícitas del runtime", () => {
    const nodes = [buildNode("story-ch1-duel-1", null, { x: 1500, y: 1400 })];

    const positionMap = buildStoryNodePositionMap(nodes);

    expect(positionMap["story-ch1-duel-1"]).toEqual({ x: 1500, y: 1400 });
  });

  it("genera segmentos usando dependencias del grafo", () => {
    const nodes = [
      buildNode("story-ch1-duel-1", null, { x: 1000, y: 1200 }),
      buildNode("story-ch1-duel-2", "story-ch1-duel-1", { x: 1000, y: 900 }),
    ];

    const positionMap = buildStoryNodePositionMap(nodes);
    const segments = resolveStoryPathSegments(nodes, positionMap);

    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ from: { x: 1000, y: 1246 }, to: { x: 1000, y: 966 } });
  });

  it("resuelve anclaje de plataforma por debajo del centro del nodo", () => {
    const anchor = resolveStoryNodePlatformAnchor("story-ch1-duel-1", {
      "story-ch1-duel-1": { x: 600, y: 700 },
    });
    expect(anchor).toEqual({ x: 600, y: 756 });
  });

  it("resuelve anclaje de token en la misma altura usada por fichas del mapa", () => {
    const anchor = resolveStoryNodeTokenAnchor("story-ch1-duel-1", {
      "story-ch1-duel-1": { x: 600, y: 700 },
    });
    expect(anchor).toEqual({ x: 600, y: 708 });
  });

  it("evita coordenadas solapadas en el acto 1 para mejorar interacción visual", () => {
    const act1 = listStoryActMapDefinitions().find((definition) => definition.act === 1);
    expect(act1).toBeDefined();
    const allPositions = [...(act1?.nodes ?? []), ...(act1?.virtualNodes ?? [])].map(
      (node) => node.position,
    );
    const minDistance = 40;
    for (let index = 0; index < allPositions.length; index += 1) {
      for (let next = index + 1; next < allPositions.length; next += 1) {
        const deltaX = allPositions[index].x - allPositions[next].x;
        const deltaY = allPositions[index].y - allPositions[next].y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        expect(distance).toBeGreaterThan(minDistance);
      }
    }
  });
});
