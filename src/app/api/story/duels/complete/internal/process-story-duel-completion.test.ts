// src/app/api/story/duels/complete/internal/process-story-duel-completion.test.ts - Verifica la penalización de Nexus al perder/abandonar un duelo Story.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IStoryDuelDefinition } from "@/core/entities/opponent/IStoryDuelDefinition";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IOpponentRepository } from "@/core/repositories/IOpponentRepository";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { IPlayerStoryDuelProgressRepository } from "@/core/repositories/IPlayerStoryDuelProgressRepository";
import { IPlayerStoryWorldRepository } from "@/core/repositories/IPlayerStoryWorldRepository";
import { StoryDuelOutcome } from "@/services/story/duel-flow/story-duel-outcome";
import { InMemoryWalletRepository } from "@/infrastructure/repositories/InMemoryWalletRepository";
import { processStoryDuelCompletion } from "./process-story-duel-completion";

const PLAYER_ID = "player-test";

function buildDuel(): IStoryDuelDefinition {
  return {
    id: "story-ch2-duel-4",
    chapter: 2,
    duelIndex: 4,
    title: "Duelo de prueba",
    description: "",
    opponentId: "opp-test",
    opponentName: "Rival",
    opponentDifficulty: "STANDARD",
    opponentAiProfile: {},
    opponentDeckCardIds: [],
    opponentDeckEntries: [],
    openingHandSize: 5,
    starterPlayer: "PLAYER",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    rewardCards: [],
    isBossDuel: false,
  };
}

function buildOpponentRepository(): IOpponentRepository {
  return { listStoryDuels: async () => [], getStoryDuel: async () => buildDuel() };
}

function buildStoryProgressRepository(): IPlayerStoryDuelProgressRepository {
  return {
    listByPlayerId: async () => [],
    getByPlayerAndDuelId: async () => null,
    registerDuelResult: async (_playerId, duelId, didWin) => ({
      playerId: PLAYER_ID,
      duelId,
      wins: didWin ? 1 : 0,
      losses: didWin ? 0 : 1,
      bestResult: didWin ? "WON" : "LOST",
      firstClearedAtIso: didWin ? "2026-04-07T00:00:00.000Z" : null,
      lastPlayedAtIso: "2026-04-07T00:00:00.000Z",
      updatedAtIso: "2026-04-07T00:00:00.000Z",
    }),
  };
}

function buildStoryWorldRepository(): IPlayerStoryWorldRepository {
  return {
    getCurrentNodeIdByPlayerId: async () => "story-ch2-duel-4",
    saveCurrentNodeId: async () => {},
    getCompactStateByPlayerId: async () => ({
      currentNodeId: "story-ch2-duel-4",
      visitedNodeIds: ["story-ch2-duel-4"],
      interactedNodeIds: [],
    }),
    saveCompactStateByPlayerId: async () => {},
    getOverworldStateByPlayerId: async () => ({ mapId: null, position: null }),
    saveOverworldState: async () => undefined,
  };
}

function buildParams(outcome: StoryDuelOutcome, walletRepository: InMemoryWalletRepository) {
  return {
    playerId: PLAYER_ID,
    payload: { chapter: 2, duelIndex: 4, outcome },
    opponentRepository: buildOpponentRepository(),
    storyProgressRepository: buildStoryProgressRepository(),
    storyWorldRepository: buildStoryWorldRepository(),
    playerProgressRepository: {} as IPlayerProgressRepository,
    walletRepository,
    collectionRepository: {} as ICardCollectionRepository,
    loadCardsByIds: async () => new Map<string, ICard>(),
  };
}

describe("processStoryDuelCompletion (penalización de Nexus)", () => {
  it("resta 50 Nexus al perder cuando hay saldo suficiente", async () => {
    const wallet = new InMemoryWalletRepository([{ playerId: PLAYER_ID, nexus: 1000 }]);
    const result = await processStoryDuelCompletion(buildParams("LOST", wallet));
    expect(result.penaltyNexus).toBe(50);
    expect((await wallet.getWallet(PLAYER_ID)).nexus).toBe(950);
  });

  it("resta 50 Nexus también al abandonar", async () => {
    const wallet = new InMemoryWalletRepository([{ playerId: PLAYER_ID, nexus: 200 }]);
    const result = await processStoryDuelCompletion(buildParams("ABANDONED", wallet));
    expect(result.penaltyNexus).toBe(50);
    expect((await wallet.getWallet(PLAYER_ID)).nexus).toBe(150);
  });

  it("limita la penalización al saldo disponible (nunca negativo)", async () => {
    const wallet = new InMemoryWalletRepository([{ playerId: PLAYER_ID, nexus: 30 }]);
    const result = await processStoryDuelCompletion(buildParams("LOST", wallet));
    expect(result.penaltyNexus).toBe(30);
    expect((await wallet.getWallet(PLAYER_ID)).nexus).toBe(0);
  });

  it("no penaliza al ganar", async () => {
    const wallet = new InMemoryWalletRepository([{ playerId: PLAYER_ID, nexus: 1000 }]);
    const result = await processStoryDuelCompletion(buildParams("WON", wallet));
    expect(result.penaltyNexus).toBe(0);
    expect((await wallet.getWallet(PLAYER_ID)).nexus).toBe(1000);
  });
});
