// src/core/use-cases/story/MoveToStoryNodeUseCase.test.ts - Valida reglas de movimiento Story entre nodos conectados del grafo.
import { buildStoryWorldGraph } from "@/core/services/story/world/build-story-world-graph";
import { MoveToStoryNodeUseCase } from "@/core/use-cases/story/MoveToStoryNodeUseCase";

const graph = buildStoryWorldGraph([
  {
    id: "d1",
    chapter: 1,
    duelIndex: 1,
    title: "A",
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
    title: "B",
    opponentName: "Beta",
    opponentDifficulty: "STANDARD",
    rewardNexus: 14,
    rewardPlayerExperience: 24,
    unlockRequirementDuelId: "d1",
    isBossDuel: false,
  },
]);

describe("MoveToStoryNodeUseCase", () => {
  it("mueve cuando el destino está desbloqueado y conectado", () => {
    const useCase = new MoveToStoryNodeUseCase();
    const output = useCase.execute({
      graph,
      progress: {
        currentNodeId: "d1",
        completedNodeIds: ["d1"],
        unlockedNodeIds: ["d1", "d2"],
        history: [],
      },
      toNodeId: "d2",
      nowIso: "2026-03-10T00:00:00.000Z",
    });
    expect(output.currentNodeId).toBe("d2");
    expect(output.history).toHaveLength(1);
    expect(output.history[0]?.kind).toBe("MOVE");
  });

  it("rechaza movimiento a nodo no desbloqueado", () => {
    const useCase = new MoveToStoryNodeUseCase();
    expect(() =>
      useCase.execute({
        graph,
        progress: {
          currentNodeId: "d1",
          completedNodeIds: [],
          unlockedNodeIds: ["d1"],
          history: [],
        },
        toNodeId: "d2",
        nowIso: "2026-03-10T00:00:00.000Z",
      }),
    ).toThrow("No se puede mover al nodo Story destino.");
  });
});
