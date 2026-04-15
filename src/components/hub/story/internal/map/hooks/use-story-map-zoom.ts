// src/components/hub/story/internal/map/hooks/use-story-map-zoom.ts - Gestiona zoom del mapa Story con rueda y controles discretos.
"use client";

import { useMotionValue } from "framer-motion";

const MIN_ZOOM = 0.62;
const MAX_ZOOM = 1.48;
const WHEEL_ZOOM_STEP = 0.05;
const PINCH_ZOOM_SENSITIVITY = 0.92;

export function clampStoryMapZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

/**
 * Suaviza el gesto de pinch para evitar saltos agresivos de escala en móviles.
 */
export function resolvePinchZoom(currentZoom: number, pinchRatio: number): number {
  if (!Number.isFinite(pinchRatio) || pinchRatio <= 0) {
    return clampStoryMapZoom(currentZoom);
  }
  const normalizedRatio = Math.pow(pinchRatio, PINCH_ZOOM_SENSITIVITY);
  return clampStoryMapZoom(currentZoom * normalizedRatio);
}

/**
 * Exponer API de zoom estable para mapa Story sin acoplarla al render principal.
 */
export function useStoryMapZoom() {
  const zoom = useMotionValue(1);
  const setZoom = (next: number) => zoom.set(clampStoryMapZoom(next));
  const applyWheelZoom = (deltaY: number): number => {
    const nextZoom = clampStoryMapZoom(zoom.get() + (deltaY < 0 ? WHEEL_ZOOM_STEP : -WHEEL_ZOOM_STEP));
    zoom.set(nextZoom);
    return nextZoom;
  };
  const applyPinchZoom = (previousDistance: number, currentDistance: number): number => {
    if (previousDistance <= 0 || currentDistance <= 0) return zoom.get();
    const pinchRatio = currentDistance / previousDistance;
    const nextZoom = resolvePinchZoom(zoom.get(), pinchRatio);
    zoom.set(nextZoom);
    return nextZoom;
  };
  return { zoom, setZoom, applyWheelZoom, applyPinchZoom };
}
