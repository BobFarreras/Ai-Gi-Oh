// src/services/story/duel-flow/story-post-duel-transition.test.ts - Verifica parseo robusto de transición post-duelo vía query params.
import { describe, expect, it } from "vitest";
import { resolveStoryPostDuelTransitionFromSearchParams } from "./story-post-duel-transition";

describe("resolveStoryPostDuelTransitionFromSearchParams", () => {
  it("construye transición válida", () => {
    const resolved = resolveStoryPostDuelTransitionFromSearchParams({
      duelOutcome: "ABANDONED",
      duelNodeId: "story-ch1-duel-1",
      returnNodeId: "story-ch1-path-blank-1",
    });
    expect(resolved).toEqual({
      outcome: "ABANDONED",
      duelNodeId: "story-ch1-duel-1",
      returnNodeId: "story-ch1-path-blank-1",
    });
  });

  it("rechaza query incompleta o inválida", () => {
    expect(resolveStoryPostDuelTransitionFromSearchParams({ duelOutcome: "DRAW" })).toBeNull();
    expect(resolveStoryPostDuelTransitionFromSearchParams({ duelOutcome: "WON", duelNodeId: "" })).toBeNull();
  });
});
