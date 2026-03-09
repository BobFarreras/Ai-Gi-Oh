// src/core/services/opponent/difficulty/resolveDifficultyFromCampaign.test.ts - Descripción breve del módulo.
import { describe, expect, it } from "vitest";
import { resolveDifficultyFromCampaign } from "./resolveDifficultyFromCampaign";

describe("resolveDifficultyFromCampaign", () => {
  it("debería devolver EASY en el inicio de campaña", () => {
    expect(resolveDifficultyFromCampaign({ chapterIndex: 1, duelIndex: 1, victories: 0 })).toBe("EASY");
  });

  it("debería escalar a NORMAL según progreso temprano", () => {
    expect(resolveDifficultyFromCampaign({ chapterIndex: 2, duelIndex: 1, victories: 2 })).toBe("NORMAL");
    expect(resolveDifficultyFromCampaign({ chapterIndex: 1, duelIndex: 4, victories: 4 })).toBe("NORMAL");
  });

  it("debería escalar a HARD en progreso medio", () => {
    expect(resolveDifficultyFromCampaign({ chapterIndex: 3, duelIndex: 1, victories: 7 })).toBe("HARD");
    expect(resolveDifficultyFromCampaign({ chapterIndex: 2, duelIndex: 5, victories: 10 })).toBe("HARD");
  });

  it("debería escalar a BOSS en tramos avanzados", () => {
    expect(resolveDifficultyFromCampaign({ chapterIndex: 5, duelIndex: 1, victories: 12 })).toBe("BOSS");
    expect(resolveDifficultyFromCampaign({ chapterIndex: 4, duelIndex: 7, victories: 20 })).toBe("BOSS");
  });
});


