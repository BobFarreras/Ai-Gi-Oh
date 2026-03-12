// src/services/story/duel-flow/resolve-story-coin-toss.test.ts - Verifica reparto base 50/50 y modificadores de inicio Story.
import { describe, expect, it } from "vitest";
import { resolveStoryCoinToss } from "./resolve-story-coin-toss";

describe("resolveStoryCoinToss", () => {
  it("respeta base 50/50 sin modificadores", () => {
    const playerStarts = resolveStoryCoinToss({
      playerId: "p1",
      opponentId: "p2",
      randomValue: 0.2,
    });
    const opponentStarts = resolveStoryCoinToss({
      playerId: "p1",
      opponentId: "p2",
      randomValue: 0.8,
    });
    expect(playerStarts.starterPlayerId).toBe("p1");
    expect(opponentStarts.starterPlayerId).toBe("p2");
  });

  it("aplica modificador de probabilidad para el jugador", () => {
    const boosted = resolveStoryCoinToss({
      playerId: "p1",
      opponentId: "p2",
      playerStartBonusPercent: 20,
      randomValue: 0.65,
    });
    expect(boosted.playerStartProbability).toBe(0.7);
    expect(boosted.starterPlayerId).toBe("p1");
  });
});
