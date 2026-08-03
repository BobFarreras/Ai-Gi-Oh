// src/services/training/arena-jaku-tier-eight.integration.test.ts - Evita bloqueos del tercer combate de Arena nivel 8 contra Jaku.
import { describe, expect, it } from "vitest";
import { runAiSimulationBatch } from "@/core/services/opponent/simulation/run-ai-simulation-batch";
import { resolveTrainingOpponentLoadout } from "./resolve-training-opponent-loadout";

describe("Arena nivel 8 contra Jaku", () => {
  it("resuelve el tercer rival con el escalado MYTHIC esperado", () => {
    const loadout = resolveTrainingOpponentLoadout({
      tier: 8,
      tierWins: 2,
      tierMatches: 2,
      aiDifficulty: "MYTHIC",
      defaultScaling: { versionTier: 5, level: 30, xp: 9800 },
    });

    expect(loadout.displayName).toBe("Jaku");
    expect(loadout.storyOpponentId).toBe("opp-jaku");
    expect(loadout.ladderIndex).toBe(2);
    expect(loadout.deck).toHaveLength(20);
    expect(loadout.fusionDeck).toHaveLength(2);
  });

  it("completa semillas con fusiones y trampas sin estados STUCK", () => {
    const jaku = resolveTrainingOpponentLoadout({
      tier: 8,
      tierWins: 2,
      tierMatches: 2,
      aiDifficulty: "MYTHIC",
      defaultScaling: { versionTier: 5, level: 30, xp: 9800 },
    });
    const rival = resolveTrainingOpponentLoadout({
      tier: 8,
      tierWins: 7,
      tierMatches: 7,
      aiDifficulty: "MYTHIC",
      defaultScaling: { versionTier: 5, level: 30, xp: 9800 },
    });

    const summary = runAiSimulationBatch({
      a: { difficulty: "MYTHIC", deck: rival.deck, fusionDeck: rival.fusionDeck },
      b: { difficulty: "MYTHIC", deck: jaku.deck, fusionDeck: jaku.fusionDeck },
      matches: 32,
      seed: "arena-tier-8-jaku",
      maxTurns: 40,
    });

    expect(summary.stuck).toBe(0);
    expect(summary.a.wins + summary.b.wins + summary.draws).toBe(32);
  });
});
