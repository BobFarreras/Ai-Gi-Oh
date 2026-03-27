// src/core/services/opponent/difficulty/map-story-difficulty-to-opponent.test.ts - Verifica mapeo estable entre dificultad Story y perfiles tácticos del bot.
import { describe, expect, it } from "vitest";
import { mapStoryDifficultyToOpponentDifficulty } from "@/core/services/opponent/difficulty/map-story-difficulty-to-opponent";

describe("mapStoryDifficultyToOpponentDifficulty", () => {
  it("mapea niveles iniciales y estándar", () => {
    expect(mapStoryDifficultyToOpponentDifficulty("ROOKIE")).toBe("EASY");
    expect(mapStoryDifficultyToOpponentDifficulty("STANDARD")).toBe("NORMAL");
  });

  it("mapea niveles altos a perfiles agresivos", () => {
    expect(mapStoryDifficultyToOpponentDifficulty("ELITE")).toBe("HARD");
    expect(mapStoryDifficultyToOpponentDifficulty("BOSS")).toBe("BOSS");
    expect(mapStoryDifficultyToOpponentDifficulty("MYTHIC")).toBe("MYTHIC");
  });
});
