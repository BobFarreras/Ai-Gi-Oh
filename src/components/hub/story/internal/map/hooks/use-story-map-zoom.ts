// src/components/hub/story/internal/map/hooks/use-story-map-zoom.ts - Gestiona zoom del mapa Story con rueda y controles discretos.
"use client";

import { useMotionValue } from "framer-motion";

const DESKTOP_MIN_ZOOM = 0.52;
const MOBILE_MIN_ZOOM = 0.26;
const MOBILE_INITIAL_ZOOM = 0.80;
const MAX_ZOOM = 1.72;
export const ZOOM_BUTTON_STEP = 0.18;
const WHEEL_ZOOM_STEP = 0.07;
const PINCH_ZOOM_SENSITIVITY = 1.04;

export function clampStoryMapZoom(value: number, isMobile: boolean): number {
  const minZoom = isMobile ? MOBILE_MIN_ZOOM : DESKTOP_MIN_ZOOM;
  return Math.max(minZoom, Math.min(MAX_ZOOM, value));
}

/**
 * Suaviza el gesto de pinch para evitar saltos agresivos de escala en móviles.
 */
export function resolvePinchZoom(currentZoom: number, pinchRatio: number, isMobile: boolean): number {
  if (!Number.isFinite(pinchRatio) || pinchRatio <= 0) {
    return clampStoryMapZoom(currentZoom, isMobile);
  }
  const normalizedRatio = Math.pow(pinchRatio, PINCH_ZOOM_SENSITIVITY);
  return clampStoryMapZoom(currentZoom * normalizedRatio, isMobile);
}

/**
 * Exponer API de zoom estable para mapa Story sin acoplarla al render principal.
 */
export function useStoryMapZoom(isMobile: boolean) {
  const zoom = useMotionValue(isMobile ? MOBILE_INITIAL_ZOOM : 1);
  const setZoom = (next: number) => zoom.set(clampStoryMapZoom(next, isMobile));
  const applyWheelZoom = (deltaY: number): number => {
    const nextZoom = clampStoryMapZoom(zoom.get() + (deltaY < 0 ? WHEEL_ZOOM_STEP : -WHEEL_ZOOM_STEP), isMobile);
    zoom.set(nextZoom);
    return nextZoom;
  };
  const applyPinchZoom = (previousDistance: number, currentDistance: number): number => {
    if (previousDistance <= 0 || currentDistance <= 0) return zoom.get();
    const pinchRatio = currentDistance / previousDistance;
    const nextZoom = resolvePinchZoom(zoom.get(), pinchRatio, isMobile);
    zoom.set(nextZoom);
    return nextZoom;
  };
  const applyStepZoom = (direction: "in" | "out"): number => {
    const nextZoom = clampStoryMapZoom(zoom.get() + (direction === "in" ? ZOOM_BUTTON_STEP : -ZOOM_BUTTON_STEP), isMobile);
    zoom.set(nextZoom);
    return nextZoom;
  };
  return { zoom, setZoom, applyWheelZoom, applyPinchZoom, applyStepZoom };
}
