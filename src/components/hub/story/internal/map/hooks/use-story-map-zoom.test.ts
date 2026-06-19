// src/components/hub/story/internal/map/hooks/use-story-map-zoom.test.ts - Valida límites y cálculo de zoom táctil del mapa Story.
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { clampStoryMapZoom, resolvePinchZoom, useStoryMapZoom } from "./use-story-map-zoom";

describe("useStoryMapZoom", () => {
  it("limita zoom por arriba y por abajo en desktop", () => {
    expect(clampStoryMapZoom(0.1, false)).toBe(0.52);
    expect(clampStoryMapZoom(2.2, false)).toBe(1.72);
  });

  it("limita zoom por abajo con MIN_ZOOM más bajo en móvil", () => {
    expect(clampStoryMapZoom(0.1, true)).toBe(0.26);
    expect(clampStoryMapZoom(2.2, true)).toBe(1.72);
  });

  it("aplica pinch-in y pinch-out sin salir de límites", () => {
    expect(resolvePinchZoom(1, 0.8, false)).toBeLessThan(1);
    expect(resolvePinchZoom(1, 1.25, false)).toBeGreaterThan(1);
    expect(resolvePinchZoom(1.68, 1.4, false)).toBe(1.72);
  });

  it("actualiza el motion value al aplicar pinch", () => {
    const { result } = renderHook(() => useStoryMapZoom(false));
    act(() => {
      result.current.setZoom(1);
      result.current.applyPinchZoom(120, 150);
    });
    expect(result.current.zoom.get()).toBeGreaterThan(1);
  });

  it("inicia con zoom panorámico en móvil y con zoom 1 en desktop", () => {
    const { result: mobile } = renderHook(() => useStoryMapZoom(true));
    const { result: desktop } = renderHook(() => useStoryMapZoom(false));
    expect(mobile.current.zoom.get()).toBeLessThan(1);
    expect(desktop.current.zoom.get()).toBe(1);
  });

  it("applyStepZoom aumenta y disminuye el zoom en pasos discretos", () => {
    const { result } = renderHook(() => useStoryMapZoom(false));
    act(() => { result.current.setZoom(1); });
    let next: number;
    act(() => { next = result.current.applyStepZoom("in"); });
    expect(next!).toBeGreaterThan(1);
    expect(result.current.zoom.get()).toBe(next!);
    act(() => { next = result.current.applyStepZoom("out"); });
    expect(next!).toBeLessThanOrEqual(1);
  });
});
