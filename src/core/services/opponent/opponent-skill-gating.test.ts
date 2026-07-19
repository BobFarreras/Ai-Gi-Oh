// src/core/services/opponent/opponent-skill-gating.test.ts - Ficha 5: gating escalonado. Verifica que las
// jugadas avanzadas (combos, cebo de trampa, planificación de fusión) solo las hacen los tiers con skill,
// mientras las reglas básicas siguen siendo universales.
import { describe, expect, it } from "vitest";
import { getDifficultyProfile } from "./difficulty/difficultyProfiles";
import type { OpponentDifficulty } from "./difficulty/types";

const ALL: OpponentDifficulty[] = ["EASY", "NORMAL", "HARD", "BOSS", "MASTER", "MYTHIC"];

describe("skill gating por tier (ficha 5)", () => {
  it("combos: HARD+ sí, EASY/NORMAL no", () => {
    expect(getDifficultyProfile("EASY").skill.combos).toBe(false);
    expect(getDifficultyProfile("NORMAL").skill.combos).toBe(false);
    for (const d of ["HARD", "BOSS", "MASTER", "MYTHIC"] as const) expect(getDifficultyProfile(d).skill.combos, d).toBe(true);
  });

  it("baitReactiveTrap: MASTER+ sí, BOSS e inferiores no", () => {
    for (const d of ["EASY", "NORMAL", "HARD", "BOSS"] as const) expect(getDifficultyProfile(d).skill.baitReactiveTrap, d).toBe(false);
    for (const d of ["MASTER", "MYTHIC"] as const) expect(getDifficultyProfile(d).skill.baitReactiveTrap, d).toBe(true);
  });

  it("las skills son monótonas al subir de tier (nunca se pierde una capacidad)", () => {
    for (let i = 1; i < ALL.length; i++) {
      const prev = getDifficultyProfile(ALL[i - 1]).skill;
      const cur = getDifficultyProfile(ALL[i]).skill;
      for (const k of ["combos", "baitReactiveTrap"] as const) {
        expect(Number(cur[k]) >= Number(prev[k]), `${ALL[i]}.${k} no puede retroceder`).toBe(true);
      }
    }
  });
});
