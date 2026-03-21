// src/core/services/training/apply-training-match-result.test.ts - Asegura actualización de progreso y desbloqueos al cerrar partidas de entrenamiento.
import { describe, expect, it } from "vitest";
import { IMatchOutcome } from "@/core/entities/match/IMatchOutcome";
import { applyTrainingMatchResult } from "./apply-training-match-result";
import { createInitialTrainingProgress, resolveTrainingTierCatalog } from "./resolve-training-tier-catalog";

function apply(outcome: IMatchOutcome) {
  return applyTrainingMatchResult({
    catalog: resolveTrainingTierCatalog(),
    progress: createInitialTrainingProgress("player-z"),
    tier: 1,
    outcome,
    updatedAtIso: "2026-03-17T10:00:00.000Z",
  });
}

describe("applyTrainingMatchResult", () => {
  it("suma victoria y desbloquea tier 2 cuando cumple requisito", () => {
    const base = createInitialTrainingProgress("player-z");
    const preloaded = { ...base, tierStats: [{ tier: 1, wins: 1, matches: 1 }], totalWins: 1, totalMatches: 1 };
    const result = applyTrainingMatchResult({
      catalog: resolveTrainingTierCatalog(),
      progress: preloaded,
      tier: 1,
      outcome: "WIN",
      updatedAtIso: "2026-03-17T10:00:00.000Z",
    });

    expect(result.nextProgress.totalWins).toBe(2);
    expect(result.nextProgress.totalMatches).toBe(2);
    expect(result.nextProgress.highestUnlockedTier).toBe(2);
    expect(result.newlyUnlockedTiers).toEqual([2]);
  });

  it("suma partida sin victoria cuando el resultado es derrota", () => {
    const result = apply("LOSE");
    expect(result.nextProgress.totalWins).toBe(0);
    expect(result.nextProgress.totalMatches).toBe(1);
    expect(result.nextProgress.highestUnlockedTier).toBe(1);
    expect(result.newlyUnlockedTiers).toEqual([]);
  });

  it("trata empate como no-victoria", () => {
    const result = apply("DRAW");
    expect(result.nextProgress.totalWins).toBe(0);
    expect(result.nextProgress.totalMatches).toBe(1);
  });
});
