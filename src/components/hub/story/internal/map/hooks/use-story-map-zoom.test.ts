// src/components/hub/story/internal/map/hooks/use-story-map-zoom.test.ts - Valida límites y cálculo de zoom táctil del mapa Story.
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { clampStoryMapZoom, resolvePinchZoom, useStoryMapZoom } from "./use-story-map-zoom";

describe("useStoryMapZoom", () => {
  it("limita zoom por arriba y por abajo", () => {
    expect(clampStoryMapZoom(0.1)).toBe(0.62);
    expect(clampStoryMapZoom(2.2)).toBe(1.48);
  });

  it("aplica pinch-in y pinch-out sin salir de límites", () => {
    expect(resolvePinchZoom(1, 0.8)).toBeLessThan(1);
    expect(resolvePinchZoom(1, 1.25)).toBeGreaterThan(1);
    expect(resolvePinchZoom(1.45, 1.4)).toBe(1.48);
  });

  it("actualiza el motion value al aplicar pinch", () => {
    const { result } = renderHook(() => useStoryMapZoom());
    act(() => {
      result.current.setZoom(1);
      result.current.applyPinchZoom(120, 150);
    });
    expect(result.current.zoom.get()).toBeGreaterThan(1);
  });
});
