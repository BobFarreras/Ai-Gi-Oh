// src/services/story/resolve-story-act-transition-target.test.ts - Verifica el mapeo de nodos especiales de transición entre actos Story.
import { describe, expect, it } from "vitest";
import { resolveStoryActTransitionTarget } from "@/services/story/resolve-story-act-transition-target";

describe("resolveStoryActTransitionTarget", () => {
  it("resuelve transición de Acto 1 a Acto 2", () => {
    expect(resolveStoryActTransitionTarget("story-ch1-transition-to-act2")).toBe(2);
  });

  it("resuelve transición de Acto 2 a Acto 1", () => {
    expect(resolveStoryActTransitionTarget("story-ch2-transition-to-act1")).toBe(1);
  });

  it("devuelve null para nodos normales", () => {
    expect(resolveStoryActTransitionTarget("story-ch2-duel-2")).toBeNull();
  });
});

