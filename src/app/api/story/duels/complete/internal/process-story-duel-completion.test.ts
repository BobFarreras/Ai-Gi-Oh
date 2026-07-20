// src/app/api/story/duels/complete/internal/process-story-duel-completion.test.ts - Verifica la penalización de Nexus al perder/abandonar un duelo Story.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IStoryDuelDefinition } from "@/core/entities/opponent/IStoryDuelDefinition";
import { IPlayerProgress } from "@/core/entities/player/IPlayerProgress";
import { ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IOpponentRepository } from "@/core/repositories/IOpponentRepository";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";
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

describe("processStoryDuelCompletion (Recaudación: Nexus de la pasiva)", () => {
  const OPERATION_ID = "3f2c1a10-9b8d-4e5f-a6b7-c8d9e0f1a2b3";

  function buildParamsWithClaim(outcome: StoryDuelOutcome) {
    const wallet = new InMemoryWalletRepository([{ playerId: PLAYER_ID, nexus: 1000 }]);
    const creditCalls: Array<{ playerId: string; earned: number; operationId: string } | null> = [];
    const params = {
      ...buildParams(outcome, wallet),
      payload: { chapter: 2, duelIndex: 4, outcome, passiveNexusEarned: 400, passiveNexusOperationId: OPERATION_ID },
      // Mock de la acreditación: registra la llamada y devuelve lo pedido (la RPC real topa en BD).
      creditPassiveNexus: async (playerId: string, claim: { earned: number; operationId: string } | null) => {
        creditCalls.push(claim ? { playerId, ...claim } : null);
        return claim ? claim.earned : 0;
      },
    };
    return { params, creditCalls };
  }

  it("acredita en duelos TERMINADOS: también al perder (los combates ganados ya ocurrieron)", async () => {
    for (const outcome of ["WON", "LOST"] as const) {
      const { params, creditCalls } = buildParamsWithClaim(outcome);
      const result = await processStoryDuelCompletion(params);
      expect(result.passiveNexusCredited).toBe(400);
      expect(creditCalls).toEqual([{ playerId: PLAYER_ID, earned: 400, operationId: OPERATION_ID }]);
    }
  });

  it("al ABANDONAR no se acredita nada (rendirse no paga)", async () => {
    const { params, creditCalls } = buildParamsWithClaim("ABANDONED");
    const result = await processStoryDuelCompletion(params);
    expect(result.passiveNexusCredited).toBe(0);
    expect(creditCalls).toEqual([null]);
  });

  it("sin reporte de la pasiva el cierre funciona igual y acredita 0", async () => {
    const wallet = new InMemoryWalletRepository([{ playerId: PLAYER_ID, nexus: 1000 }]);
    const result = await processStoryDuelCompletion({
      ...buildParams("WON", wallet),
      creditPassiveNexus: async () => 0,
    });
    expect(result.passiveNexusCredited).toBe(0);
  });
});

describe("processStoryDuelCompletion (economía del árbol de habilidades)", () => {
  function buildRewardOpponentRepository(): IOpponentRepository {
    const duel: IStoryDuelDefinition = { ...buildDuel(), rewardNexus: 100, rewardPlayerExperience: 200 };
    return { listStoryDuels: async () => [], getStoryDuel: async () => duel };
  }

  function buildProgressRepository(): IPlayerProgressRepository {
    const current: IPlayerProgress = {
      playerId: PLAYER_ID, hasCompletedTutorial: true, medals: 0, storyChapter: 2,
      playerExperience: 0, updatedAtIso: "2026-07-18T00:00:00.000Z",
    };
    return {
      getByPlayerId: async () => current,
      create: async () => current,
      update: async (input) => ({ ...current, playerExperience: input.playerExperience ?? 0 }),
    };
  }

  function economyTree(throwing = false): ISkillTreeRepository {
    return {
      getActiveCatalog: async (): Promise<ISkillTreeNode[]> => {
        if (throwing) throw new Error("tablas del árbol no migradas");
        return [
          { id: "node-econ-comision", branch: "ECONOMY", tier: 1, maxRank: 5, costPerRank: 1,
            effect: { kind: "NEXUS_REWARD_MULT", valuePerRank: 0.02 }, prerequisites: [], display: { name: "Comisión", blurb: "" } },
          { id: "node-econ-aprendizaje", branch: "ECONOMY", tier: 1, maxRank: 5, costPerRank: 1,
            effect: { kind: "XP_REWARD_MULT", valuePerRank: 0.02 }, prerequisites: [], display: { name: "Aprendizaje", blurb: "" } },
        ];
      },
      getPlayerRanks: async () => [{ nodeId: "node-econ-comision", rank: 5 }, { nodeId: "node-econ-aprendizaje", rank: 5 }],
      rankUp: async () => ({ ok: true, nodeId: "", rank: 0 }),
      respec: async () => ({ ok: true }),
    };
  }

  it("boostea Nexus y XP de la primera victoria (+10%)", async () => {
    const wallet = new InMemoryWalletRepository([{ playerId: PLAYER_ID, nexus: 1000 }]);
    const result = await processStoryDuelCompletion({
      ...buildParams("WON", wallet),
      opponentRepository: buildRewardOpponentRepository(),
      playerProgressRepository: buildProgressRepository(),
      skillTreeRepository: economyTree(),
      creditPassiveNexus: async () => 0,
    });
    expect(result.rewardNexus).toBe(110);
    expect(result.rewardPlayerExperience).toBe(220);
    expect((await wallet.getWallet(PLAYER_ID)).nexus).toBe(1110);
  });

  it("NO-FATAL: si el árbol falla, se acredita la recompensa base", async () => {
    const wallet = new InMemoryWalletRepository([{ playerId: PLAYER_ID, nexus: 1000 }]);
    const result = await processStoryDuelCompletion({
      ...buildParams("WON", wallet),
      opponentRepository: buildRewardOpponentRepository(),
      playerProgressRepository: buildProgressRepository(),
      skillTreeRepository: economyTree(true),
      creditPassiveNexus: async () => 0,
    });
    expect(result.rewardNexus).toBe(100);
    expect(result.rewardPlayerExperience).toBe(200);
  });
});
