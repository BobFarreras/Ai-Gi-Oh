// src/components/hub/story/internal/map/hooks/use-story-avatar-travel.test.tsx - Comprueba transición visual del avatar Story entre nodos.
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStoryAvatarTravel } from "@/components/hub/story/internal/map/hooks/use-story-avatar-travel";

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    animate: (_value: unknown, _target: unknown, options?: { onComplete?: () => void }) => {
      options?.onComplete?.();
      return { stop: vi.fn() };
    },
  };
});

describe("useStoryAvatarTravel", () => {
  it("actualiza motion values al cambiar de nodo destino", async () => {
    const resolvePosition = (nodeId: string) => (nodeId === "a" ? { x: 100, y: 100 } : { x: 200, y: 200 });
    const hook = renderHook(
      ({ target }) => useStoryAvatarTravel({ targetNodeId: target, resolvePosition }),
      { initialProps: { target: "a" } },
    );

    hook.rerender({ target: "b" });

    await waitFor(() => {
      expect(hook.result.current.avatarX.get()).toBe(100);
      expect(hook.result.current.avatarY.get()).toBe(100);
    });
  });
});
