// src/core/services/opponent/difficulty/resolve-opponent-difficulty-profile.test.ts - Verifica mezcla de dificultad base con style/aggression para IA rival.
import { describe, expect, it } from "vitest";
import { resolveOpponentDifficultyProfile } from "@/core/services/opponent/difficulty/resolve-opponent-difficulty-profile";

describe("resolveOpponentDifficultyProfile", () => {
  it("aplica fallback robusto cuando ai_profile es inválido", () => {
    const profile = resolveOpponentDifficultyProfile({ difficulty: "NORMAL", aiProfile: null });
    expect(profile.key).toBe("NORMAL");
    expect(profile.directAttackBias).toBeGreaterThan(0);
  });

  it("estilo aggressive sube sesgo ofensivo y baja aversión al riesgo", () => {
    const aggressive = resolveOpponentDifficultyProfile({
      difficulty: "HARD",
      aiProfile: { style: "aggressive", aggression: 0.9 },
    });
    const control = resolveOpponentDifficultyProfile({
      difficulty: "HARD",
      aiProfile: { style: "control", aggression: 0.2 },
    });
    expect(aggressive.directAttackBias).toBeGreaterThan(control.directAttackBias);
    expect(aggressive.executionAggroBias).toBeGreaterThan(control.executionAggroBias);
    expect(aggressive.attackerLossPenalty).toBeLessThan(control.attackerLossPenalty);
  });

  it("mantiene presión mínima en dificultades altas aunque ai_profile sea pasivo", () => {
    const hardPassive = resolveOpponentDifficultyProfile({
      difficulty: "HARD",
      aiProfile: { style: "control", aggression: 0.1 },
    });
    const mythicPassive = resolveOpponentDifficultyProfile({
      difficulty: "MYTHIC",
      aiProfile: { style: "control", aggression: 0.1 },
    });
    expect(mythicPassive.directAttackBias).toBeGreaterThan(hardPassive.directAttackBias);
    expect(mythicPassive.executionAggroBias).toBeGreaterThan(hardPassive.executionAggroBias);
    expect(mythicPassive.minAttackScore).toBeGreaterThan(hardPassive.minAttackScore);
  });
});
