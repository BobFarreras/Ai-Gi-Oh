// src/components/hub/story/internal/map/hooks/use-story-camera-bounds.ts - Devuelve función para aplicar topes de cámara y evitar zonas vacías del mapa.
"use client";

import { RefObject, useCallback } from "react";
import { clampStoryCameraPosition, resolveStoryCameraBounds } from "@/components/hub/story/internal/map/layout/story-camera-bounds";

interface IUseStoryCameraBoundsInput {
  mapContainerRef: RefObject<HTMLDivElement | null>;
  canvasWidth: number;
  canvasHeight: number;
  getScale: () => number;
  cameraX: { get: () => number; set: (value: number) => void };
  cameraY: { get: () => number; set: (value: number) => void };
}

export function useStoryCameraBounds(input: IUseStoryCameraBoundsInput) {
  return useCallback(() => {
    if (!input.mapContainerRef.current) return;
    const bounds = resolveStoryCameraBounds({
      containerWidth: input.mapContainerRef.current.clientWidth,
      containerHeight: input.mapContainerRef.current.clientHeight,
      canvasWidth: input.canvasWidth,
      canvasHeight: input.canvasHeight,
      scale: input.getScale(),
    });
    input.cameraX.set(clampStoryCameraPosition(input.cameraX.get(), bounds.minX, bounds.maxX));
    input.cameraY.set(clampStoryCameraPosition(input.cameraY.get(), bounds.minY, bounds.maxY));
  }, [input]);
}
