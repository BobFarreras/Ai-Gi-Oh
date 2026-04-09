// src/app/api/story/duels/complete/internal/resolve-story-duel-return-node.test.ts - Evita retroceso de acto al cerrar duelos perdidos/abandonados.
import { describe, expect, it } from "vitest";
import { IOpponentRepository } from "@/core/repositories/IOpponentRepository";
import { IPlayerStoryDuelProgressRepository } from "@/core/repositories/IPlayerStoryDuelProgressRepository";
import { IPlayerStoryWorldRepository } from "@/core/repositories/IPlayerStoryWorldRepository";
import { IPlayerStoryWorldCompactState } from "@/core/entities/story/IPlayerStoryWorldCompactState";
import { resolveStoryDuelReturnNode } from "./resolve-story-duel-return-node";

function createOpponentRepositoryStub(): IOpponentRepository {
  return {
    listStoryDuels: async () => [],
    getStoryDuel: async () => null,
  };
}

function createStoryProgressRepositoryStub(): IPlayerStoryDuelProgressRepository {
  return {
    listByPlayerId: async () => [],
    getByPlayerAndDuelId: async () => null,
    registerDuelResult: async () => ({
      playerId: "player-test",
      duelId: "story-ch2-duel-4",
      wins: 0,
      losses: 1,
      bestResult: "LOST",
      firstClearedAtIso: null,
      lastPlayedAtIso: "2026-04-07T00:00:00.000Z",
      updatedAtIso: "2026-04-07T00:00:00.000Z",
    }),
  };
}

function createStoryWorldRepositoryStub(initialState: IPlayerStoryWorldCompactState): {
  repository: IPlayerStoryWorldRepository;
  reads: number;
  savedState: IPlayerStoryWorldCompactState | null;
} {
  let reads = 0;
  let savedState: IPlayerStoryWorldCompactState | null = null;
  const repository: IPlayerStoryWorldRepository = {
    getCurrentNodeIdByPlayerId: async () => initialState.currentNodeId,
    saveCurrentNodeId: async () => {},
    getCompactStateByPlayerId: async () => {
      reads += 1;
      return initialState;
    },
    saveCompactStateByPlayerId: async (_playerId, state) => {
      savedState = state;
    },
  };
  return {
    repository,
    get reads() {
      return reads;
    },
    get savedState() {
      return savedState;
    },
  };
}

describe("resolveStoryDuelReturnNode", () => {
  it("mantiene el retorno en el mismo nodo de duelo cuando no se gana", async () => {
    const world = createStoryWorldRepositoryStub({
      currentNodeId: "story-ch2-duel-4",
      visitedNodeIds: ["story-ch1-duel-5", "story-ch2-duel-4"],
      interactedNodeIds: [],
    });

    const returnNodeId = await resolveStoryDuelReturnNode({
      playerId: "player-test",
      duelNodeId: "story-ch2-duel-4",
      didWin: false,
      opponentRepository: createOpponentRepositoryStub(),
      storyProgressRepository: createStoryProgressRepositoryStub(),
      storyWorldRepository: world.repository,
    });

    expect(returnNodeId).toBe("story-ch2-duel-4");
    expect(world.reads).toBe(1);
    expect(world.savedState?.currentNodeId).toBe("story-ch2-duel-4");
    expect(world.savedState?.visitedNodeIds).toContain("story-ch2-duel-4");
  });
});
