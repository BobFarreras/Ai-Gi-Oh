// src/components/hub/story/internal/map/hooks/use-story-map-zoom.ts - Gestiona zoom del mapa Story con rueda y controles discretos.
"use client";

import { useMotionValue } from "framer-motion";
import { WheelEventHandler } from "react";

const MIN_ZOOM = 0.72;
const MAX_ZOOM = 1.48;

function clampZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

/**
 * Exponer API de zoom estable para mapa Story sin acoplarla al render principal.
 */
export function useStoryMapZoom() {
  const zoom = useMotionValue(1);
  const setZoom = (next: number) => zoom.set(clampZoom(next));
  const zoomIn = () => setZoom(zoom.get() + 0.1);
  const zoomOut = () => setZoom(zoom.get() - 0.1);
  const resetZoom = () => setZoom(1);
  const handleWheel: WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setZoom(zoom.get() + (event.deltaY < 0 ? 0.05 : -0.05));
  };
  return { zoom, zoomIn, zoomOut, resetZoom, handleWheel };
}
