// src/services/story/resolve-story-reward-card-visual.test.ts - Verifica el mapeo de visuales de carta recompensa Story.
import { describe, expect, it } from "vitest";
import { resolveStoryRewardCardVisual } from "@/services/story/resolve-story-reward-card-visual";

describe("resolveStoryRewardCardVisual", () => {
  it("devuelve imagen real para rewardCardId conocido", () => {
    const visual = resolveStoryRewardCardVisual("trap-windows92-crash");
    expect(visual).toEqual({
      src: "/assets/renders/windows92.png",
      alt: "Carta recompensa Windows92",
    });
  });

  it("aplica fallback para rewardCardId desconocido", () => {
    const visual = resolveStoryRewardCardVisual("unknown-card");
    expect(visual).toEqual({
      src: "/assets/renders/wrap.png",
      alt: "Carta recompensa",
    });
  });
});
