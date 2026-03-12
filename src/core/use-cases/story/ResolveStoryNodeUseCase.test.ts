// src/core/use-cases/story/ResolveStoryNodeUseCase.test.ts - Comprueba resolución de nodo Story y expansión de desbloqueos por progreso.
import { buildStoryWorldGraph } from "@/core/services/story/world/build-story-world-graph";
import { ResolveStoryNodeUseCase } from "@/core/use-cases/story/ResolveStoryNodeUseCase";

const graph = buildStoryWorldGraph([
  {
    id: "d1",
    chapter: 1,
    duelIndex: 1,
    title: "Inicio",
    opponentName: "Alpha",
    opponentDifficulty: "ROOKIE",
    rewardNexus: 10,
    rewardPlayerExperience: 20,
    unlockRequirementDuelId: null,
    isBossDuel: false,
  },
  {
    id: "d2",
    chapter: 1,
    duelIndex: 2,
    title: "Puente",
    opponentName: "Beta",
    opponentDifficulty: "STANDARD",
    rewardNexus: 12,
    rewardPlayerExperience: 22,
    unlockRequirementDuelId: "d1",
    isBossDuel: false,
  },
]);

describe("ResolveStoryNodeUseCase", () => {
  it("marca completado y genera eventos de historial", () => {
    const useCase = new ResolveStoryNodeUseCase();
    const output = useCase.execute({
      graph,
      progress: {
        currentNodeId: "d1",
        completedNodeIds: [],
        unlockedNodeIds: ["d1"],
        history: [],
      },
      nodeId: "d1",
      nowIso: "2026-03-10T00:00:00.000Z",
    });
    expect(output.progress.completedNodeIds).toEqual(["d1"]);
    expect(output.progress.unlockedNodeIds).toEqual(["d1", "d2"]);
    expect(output.rewardNexus).toBe(10);
    expect(output.progress.history.map((event) => event.kind)).toEqual([
      "NODE_RESOLVED",
      "REWARD_GRANTED",
    ]);
  });

  it("rechaza resolver nodo bloqueado", () => {
    const useCase = new ResolveStoryNodeUseCase();
    expect(() =>
      useCase.execute({
        graph,
        progress: {
          currentNodeId: "d1",
          completedNodeIds: [],
          unlockedNodeIds: ["d1"],
          history: [],
        },
        nodeId: "d2",
        nowIso: "2026-03-10T00:00:00.000Z",
      }),
    ).toThrow("No se puede resolver un nodo Story bloqueado.");
  });
});
