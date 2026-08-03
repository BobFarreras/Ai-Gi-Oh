// src/core/services/match/rewards/match-reward-policy.test.ts - Valida política de recompensas desacoplada por modo de combate.
import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors/ValidationError";
import { resolveMatchReward } from "@/core/services/match/rewards/match-reward-policy";

describe("match-reward-policy", () => {
  it("tutorial nunca otorga recompensa", () => {
    expect(resolveMatchReward({ mode: "TUTORIAL", outcome: "WIN" })).toEqual({ nexus: 0, playerExperience: 0 });
    expect(resolveMatchReward({ mode: "TUTORIAL", outcome: "LOSE" })).toEqual({ nexus: 0, playerExperience: 0 });
  });

  it("story escala por tier de oponente", () => {
    const tier3 = resolveMatchReward({ mode: "STORY", outcome: "WIN", storyOpponentTier: 3 });
    expect(tier3).toEqual({ nexus: 150, playerExperience: 330 });
  });

  it("story rechaza tier inválido", () => {
    expect(() => resolveMatchReward({ mode: "STORY", outcome: "WIN", storyOpponentTier: 0 })).toThrow(ValidationError);
  });

  it("multijugador usa curva propia", () => {
    expect(resolveMatchReward({ mode: "MULTIPLAYER", outcome: "DRAW" })).toEqual({ nexus: 45, playerExperience: 80 });
  });

  it.each(["SURVIVAL", "OLYMPUS"] as const)("no concede recompensas genéricas al modo %s", (mode) => {
    expect(resolveMatchReward({ mode, outcome: "WIN" })).toEqual({ nexus: 0, playerExperience: 0 });
  });
});
