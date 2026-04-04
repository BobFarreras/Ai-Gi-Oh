// src/services/story/resolve-story-reward-card-visual.test.ts - Verifica el mapeo de visuales de carta recompensa Story.
import { describe, expect, it } from "vitest";
import { resolveStoryRewardCardVisual } from "@/services/story/resolve-story-reward-card-visual";

describe("resolveStoryRewardCardVisual", () => {
  it("resuelve render de trampa por convención de carpeta", () => {
    const visual = resolveStoryRewardCardVisual("trap-atk-drain");
    expect(visual).toEqual({
      src: "/assets/renders/traps/trap-atk-drain.webp",
      alt: "Carta recompensa trap-atk-drain",
    });
  });

  it("resuelve render de ejecución por convención de carpeta", () => {
    const visual = resolveStoryRewardCardVisual("exec-draw-1");
    expect(visual).toEqual({
      src: "/assets/renders/executions/exec-draw-1.webp",
      alt: "Carta recompensa exec-draw-1",
    });
  });

  it("aplica fallback para rewardCardId sin prefijo soportado", () => {
    const visual = resolveStoryRewardCardVisual("entity-python");
    expect(visual).toEqual({
      src: "/assets/renders/wrap.webp",
      alt: "Carta recompensa",
    });
  });
});
