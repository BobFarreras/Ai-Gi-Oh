// src/components/hub/story/internal/map/hooks/use-story-map-zoom.ts - Gestiona zoom del mapa Story con rueda y controles discretos.
"use client";

import { useMotionValue } from "framer-motion";

const MIN_ZOOM = 0.72;
const MAX_ZOOM = 1.48;

export function clampStoryMapZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

/**
 * Exponer API de zoom estable para mapa Story sin acoplarla al render principal.
 */
export function useStoryMapZoom() {
  const zoom = useMotionValue(1);
  const setZoom = (next: number) => zoom.set(clampStoryMapZoom(next));
  const applyWheelZoom = (deltaY: number): number => {
    const nextZoom = clampStoryMapZoom(zoom.get() + (deltaY < 0 ? 0.05 : -0.05));
    zoom.set(nextZoom);
    return nextZoom;
  };
  return { zoom, setZoom, applyWheelZoom };
}
