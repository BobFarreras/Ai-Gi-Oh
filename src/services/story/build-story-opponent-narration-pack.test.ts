// src/services/story/build-story-opponent-narration-pack.test.ts - Valida personalización de textos/audio/retratos narrativos por oponente Story.
import { buildStoryOpponentNarrationPack } from "./build-story-opponent-narration-pack";
import { describe, expect, it } from "vitest";

describe("buildStoryOpponentNarrationPack", () => {
  it("aplica overrides del primer oponente de story", () => {
    const pack = buildStoryOpponentNarrationPack({
      opponentId: "opp-ch1-apprentice",
      opponentName: "Apprentice Null",
      duelDescription: "Descripción base",
    });
    const startOpponent = pack.lines.find((line) => line.id === "start-opponent");
    expect(startOpponent?.portraitUrl).toContain("opp-ch1-apprentice/intro-GenNvim");
    expect(startOpponent?.audioUrl).toContain("intro.mp3");
  });

  it("usa fallback de descripción en oponentes sin override", () => {
    const pack = buildStoryOpponentNarrationPack({
      opponentId: "unknown-opponent",
      opponentName: "Unknown",
      duelDescription: "Mensaje fallback",
    });
    const startOpponent = pack.lines.find((line) => line.id === "start-opponent");
    expect(startOpponent?.text).toBe("Mensaje fallback");
  });
});
