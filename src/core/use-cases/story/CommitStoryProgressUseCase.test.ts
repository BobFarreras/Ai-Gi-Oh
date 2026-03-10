// src/core/use-cases/story/CommitStoryProgressUseCase.test.ts - Verifica persistencia de cursor e historial Story mediante repositorio.
import { IPlayerStoryHistoryEvent } from "@/core/entities/story/IPlayerStoryHistoryEvent";
import { IPlayerStoryWorldRepository } from "@/core/repositories/IPlayerStoryWorldRepository";
import { CommitStoryProgressUseCase } from "@/core/use-cases/story/CommitStoryProgressUseCase";

describe("CommitStoryProgressUseCase", () => {
  it("guarda nodo actual e historial en repositorio", async () => {
    const calls: { currentNodeId?: string | null; events?: IPlayerStoryHistoryEvent[] } = {};
    const repository: IPlayerStoryWorldRepository = {
      getCurrentNodeIdByPlayerId: async () => null,
      saveCurrentNodeId: async (_playerId, currentNodeId) => {
        calls.currentNodeId = currentNodeId;
      },
      listHistoryByPlayerId: async () => [],
      appendHistoryEvents: async (_playerId, events) => {
        calls.events = events;
      },
    };
    const useCase = new CommitStoryProgressUseCase(repository);
    await useCase.execute({
      playerId: "player-1",
      progress: {
        currentNodeId: "story-ch1-duel-2",
        completedNodeIds: ["story-ch1-duel-1"],
        unlockedNodeIds: ["story-ch1-duel-1", "story-ch1-duel-2"],
        history: [
          {
            eventId: "move-story-ch1-duel-2",
            nodeId: "story-ch1-duel-2",
            kind: "MOVE",
            createdAtIso: "2026-03-10T00:00:00.000Z",
            details: "Movimiento al nodo.",
          },
        ],
      },
    });
    expect(calls.currentNodeId).toBe("story-ch1-duel-2");
    expect(calls.events).toHaveLength(1);
    expect(calls.events?.[0]?.playerId).toBe("player-1");
  });
});
