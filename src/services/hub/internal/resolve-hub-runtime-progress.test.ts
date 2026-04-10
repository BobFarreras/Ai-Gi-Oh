// src/services/hub/internal/resolve-hub-runtime-progress.test.ts - Verifica resolución de capítulo y medallas reales para HUD del Hub.
import { describe, expect, it } from "vitest";
import { resolveHubRuntimeProgress } from "@/services/hub/internal/resolve-hub-runtime-progress";

describe("resolveHubRuntimeProgress", () => {
  it("usa capítulo parseado desde nodo Story actual cuando existe", () => {
    const result = resolveHubRuntimeProgress({
      fallbackStoryChapter: 1,
      fallbackMedals: 0,
      storyCurrentNodeId: "story-ch2-duel-7",
      trainingTotalWins: 5,
    });
    expect(result).toEqual({ storyChapter: 2, medals: 5 });
  });

  it("acepta nodos virtuales de acto para derivar capítulo", () => {
    const result = resolveHubRuntimeProgress({
      fallbackStoryChapter: 1,
      fallbackMedals: 0,
      storyCurrentNodeId: "story-a3-event-briefing",
      trainingTotalWins: 2,
    });
    expect(result.storyChapter).toBe(3);
  });

  it("aplica fallback cuando no hay datos runtime", () => {
    const result = resolveHubRuntimeProgress({
      fallbackStoryChapter: 2,
      fallbackMedals: 4,
      storyCurrentNodeId: null,
      trainingTotalWins: null,
    });
    expect(result).toEqual({ storyChapter: 2, medals: 4 });
  });
});
