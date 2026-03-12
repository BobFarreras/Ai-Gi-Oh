// src/core/use-cases/story/GetStoryWorldStateUseCase.test.ts - Verifica proyección de estado Story desde repositorios en formato grafo.
import { IOpponentRepository } from "@/core/repositories/IOpponentRepository";
import { IPlayerStoryDuelProgressRepository } from "@/core/repositories/IPlayerStoryDuelProgressRepository";
import { GetStoryWorldStateUseCase } from "@/core/use-cases/story/GetStoryWorldStateUseCase";

describe("GetStoryWorldStateUseCase", () => {
  it("resuelve nodos desbloqueados y completados del jugador", async () => {
    const opponentRepository: IOpponentRepository = {
      listStoryDuels: async () => [
        {
          id: "d1",
          chapter: 1,
          duelIndex: 1,
          title: "A",
          opponentId: "o1",
          opponentName: "Alpha",
          opponentDifficulty: "ROOKIE",
          unlockRequirementDuelId: null,
          rewardNexus: 10,
          rewardPlayerExperience: 20,
          isBossDuel: false,
          isActive: true,
        },
        {
          id: "d2",
          chapter: 1,
          duelIndex: 2,
          title: "B",
          opponentId: "o2",
          opponentName: "Beta",
          opponentDifficulty: "STANDARD",
          unlockRequirementDuelId: "d1",
          rewardNexus: 12,
          rewardPlayerExperience: 26,
          isBossDuel: false,
          isActive: true,
        },
      ],
      getStoryDuel: async () => null,
    };
    const progressRepository: IPlayerStoryDuelProgressRepository = {
      listByPlayerId: async () => [
        {
          playerId: "p1",
          duelId: "d1",
          wins: 1,
          losses: 0,
          bestResult: "WON",
          firstClearedAtIso: null,
          lastPlayedAtIso: null,
          updatedAtIso: "2026-03-10T00:00:00.000Z",
        },
      ],
      getByPlayerAndDuelId: async () => null,
      registerDuelResult: async () => {
        throw new Error("not used");
      },
    };

    const useCase = new GetStoryWorldStateUseCase(opponentRepository, progressRepository);
    const output = await useCase.execute({ playerId: "p1" });

    expect(output.graph.nodes).toHaveLength(2);
    expect(output.progress.completedNodeIds).toEqual(["d1"]);
    expect(output.progress.unlockedNodeIds).toEqual(["d1", "d2"]);
    expect(output.progress.currentNodeId).toBe("d2");
  });
});
