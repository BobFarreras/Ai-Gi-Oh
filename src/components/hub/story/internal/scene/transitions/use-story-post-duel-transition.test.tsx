// src/components/hub/story/internal/scene/transitions/use-story-post-duel-transition.test.tsx - Valida transición visual post-duelo para victoria y derrota.
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStoryPostDuelTransition } from "./use-story-post-duel-transition";

describe("useStoryPostDuelTransition", () => {
  it("dispara retirada del rival cuando el outcome es WON", () => {
    const setAvatarVisualTarget = vi.fn();
    const setRetreatingNodeId = vi.fn();
    renderHook(() =>
      useStoryPostDuelTransition({
        transition: {
          outcome: "WON",
          duelNodeId: "story-ch1-duel-1",
          returnNodeId: "story-ch1-duel-1",
        },
        currentNodeId: "story-ch1-duel-1",
        setAvatarVisualTarget,
        setRetreatingNodeId,
      }),
    );
    expect(setRetreatingNodeId).toHaveBeenCalledWith("story-ch1-duel-1");
    expect(setRetreatingNodeId).not.toHaveBeenCalledWith(null);
  });

  it("mueve avatar de duelo a nodo retorno cuando outcome no es WON", () => {
    vi.useFakeTimers();
    const setAvatarVisualTarget = vi.fn();
    const setRetreatingNodeId = vi.fn();
    renderHook(() =>
      useStoryPostDuelTransition({
        transition: {
          outcome: "LOST",
          duelNodeId: "story-ch1-duel-1",
          returnNodeId: "story-ch1-path-blank-1",
        },
        currentNodeId: "story-ch1-path-blank-1",
        setAvatarVisualTarget,
        setRetreatingNodeId,
      }),
    );
    expect(setAvatarVisualTarget).toHaveBeenCalledWith({ nodeId: "story-ch1-duel-1", stance: "SIDE" });
    vi.advanceTimersByTime(260);
    expect(setAvatarVisualTarget).toHaveBeenCalledWith({ nodeId: "story-ch1-path-blank-1", stance: "CENTER" });
    expect(setRetreatingNodeId).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
