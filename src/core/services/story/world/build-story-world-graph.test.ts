// src/core/services/story/world/build-story-world-graph.test.ts - Verifica construcción de grafo Story, desbloqueo y reglas de navegación.
import {
  buildStoryWorldGraph,
  resolveStoryUnlockedNodeIds,
} from "@/core/services/story/world/build-story-world-graph";
import { canMoveBetweenStoryNodes } from "@/core/services/story/world/story-world-navigation";
import { StoryWorldSeedNode } from "@/core/services/story/world/story-world-types";

const STORY_SEED: StoryWorldSeedNode[] = [
  {
    id: "duel-1",
    chapter: 1,
    duelIndex: 1,
    title: "Inicio",
    opponentName: "Rookie",
    opponentDifficulty: "ROOKIE",
    rewardNexus: 10,
    rewardPlayerExperience: 20,
    unlockRequirementDuelId: null,
    isBossDuel: false,
  },
  {
    id: "duel-2",
    chapter: 1,
    duelIndex: 2,
    title: "Bifurcación",
    opponentName: "Sentinel",
    opponentDifficulty: "STANDARD",
    rewardNexus: 14,
    rewardPlayerExperience: 24,
    unlockRequirementDuelId: "duel-1",
    isBossDuel: false,
  },
  {
    id: "duel-3",
    chapter: 1,
    duelIndex: 3,
    title: "Boss",
    opponentName: "Core",
    opponentDifficulty: "BOSS",
    rewardNexus: 40,
    rewardPlayerExperience: 65,
    unlockRequirementDuelId: "duel-2",
    isBossDuel: true,
  },
];

describe("story world graph", () => {
  it("crea nodos con tipo correcto y aristas de conexión", () => {
    const graph = buildStoryWorldGraph(STORY_SEED);
    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toEqual([
      { fromNodeId: "duel-1", toNodeId: "duel-2" },
      { fromNodeId: "duel-2", toNodeId: "duel-3" },
    ]);
    expect(graph.nodes[2]?.nodeType).toBe("BOSS");
  });

  it("desbloquea por completado del nodo anterior", () => {
    const graph = buildStoryWorldGraph(STORY_SEED);
    expect(resolveStoryUnlockedNodeIds(graph, [])).toEqual(["duel-1"]);
    expect(resolveStoryUnlockedNodeIds(graph, ["duel-1"])).toEqual(["duel-1", "duel-2"]);
    expect(resolveStoryUnlockedNodeIds(graph, ["duel-1", "duel-2"])).toEqual([
      "duel-1",
      "duel-2",
      "duel-3",
    ]);
  });

  it("desbloquea de inicio nodos sin dependencia explícita aunque no sean el primero por índice", () => {
    const graph = buildStoryWorldGraph([
      ...STORY_SEED,
      {
        id: "duel-4",
        chapter: 1,
        duelIndex: 4,
        title: "Rama Libre",
        opponentName: "Scout",
        opponentDifficulty: "STANDARD",
        rewardNexus: 18,
        rewardPlayerExperience: 30,
        unlockRequirementDuelId: null,
        isBossDuel: false,
      },
    ]);
    expect(resolveStoryUnlockedNodeIds(graph, [])).toEqual(["duel-1", "duel-4"]);
  });

  it("permite moverse solo a nodos conectados y desbloqueados", () => {
    const graph = buildStoryWorldGraph(STORY_SEED);
    const unlocked = ["duel-1", "duel-2"];
    expect(
      canMoveBetweenStoryNodes({
        graph,
        fromNodeId: "duel-1",
        toNodeId: "duel-2",
        unlockedNodeIds: unlocked,
      }),
    ).toBe(true);
    expect(
      canMoveBetweenStoryNodes({
        graph,
        fromNodeId: "duel-1",
        toNodeId: "duel-3",
        unlockedNodeIds: unlocked,
      }),
    ).toBe(false);
  });
});
