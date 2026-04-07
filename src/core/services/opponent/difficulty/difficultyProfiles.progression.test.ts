// src/core/services/opponent/difficulty/difficultyProfiles.progression.test.ts - Verifica que el perfil táctico escale claramente por nivel de dificultad.
import { describe, expect, it } from "vitest";
import { getDifficultyProfile } from "@/core/services/opponent/difficulty/difficultyProfiles";

describe("difficultyProfiles progression", () => {
  it("sube presión ofensiva y exigencia táctica entre niveles", () => {
    const easy = getDifficultyProfile("EASY");
    const normal = getDifficultyProfile("NORMAL");
    const hard = getDifficultyProfile("HARD");
    const boss = getDifficultyProfile("BOSS");
    const mythic = getDifficultyProfile("MYTHIC");

    expect(easy.directAttackBias).toBeLessThan(normal.directAttackBias);
    expect(normal.directAttackBias).toBeLessThan(hard.directAttackBias);
    expect(hard.directAttackBias).toBeLessThan(boss.directAttackBias);
    expect(boss.directAttackBias).toBeLessThan(mythic.directAttackBias);

    expect(easy.minAttackScore).toBeLessThan(normal.minAttackScore);
    expect(normal.minAttackScore).toBeLessThan(hard.minAttackScore);
    expect(hard.minAttackScore).toBeLessThan(boss.minAttackScore);
    expect(boss.minAttackScore).toBeLessThan(mythic.minAttackScore);
  });
});
