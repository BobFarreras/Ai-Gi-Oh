// src/components/hub/story/internal/map/hooks/use-story-map-gesture-controls.ts - Encapsula controles táctiles/rueda del mapa Story preservando centro de cámara.
"use client";

import { useRef } from "react";

interface IStoryTouchListLike {
  length: number;
  item: (index: number) => { clientX: number; clientY: number } | null;
}

/**
 * Aplica zoom por rueda y pinch con corrección de centro para evitar saltos de cámara.
 */
export function useStoryMapGestureControls(input: {
  getZoom: () => number;
  applyWheelZoom: (deltaY: number) => number;
  applyPinchZoom: (previousDistance: number, currentDistance: number) => number;
  keepCameraCenterOnZoom: (previousZoom: number, nextZoom: number) => void;
  applyCameraBounds: () => void;
}) {
  const pinchDistanceRef = useRef<number | null>(null);

  const handlePinchZoom = (touches: IStoryTouchListLike): void => {
    if (touches.length !== 2) {
      pinchDistanceRef.current = null;
      return;
    }
    const [firstTouch, secondTouch] = [touches.item(0), touches.item(1)];
    if (!firstTouch || !secondTouch) return;
    const currentDistance = Math.hypot(firstTouch.clientX - secondTouch.clientX, firstTouch.clientY - secondTouch.clientY);
    const previousDistance = pinchDistanceRef.current;
    pinchDistanceRef.current = currentDistance;
    if (!previousDistance) return;
    const previousZoom = input.getZoom();
    const nextZoom = input.applyPinchZoom(previousDistance, currentDistance);
    input.keepCameraCenterOnZoom(previousZoom, nextZoom);
    input.applyCameraBounds();
  };

  return {
    onWheel: (deltaY: number) => {
      const previousZoom = input.getZoom();
      const nextZoom = input.applyWheelZoom(deltaY);
      input.keepCameraCenterOnZoom(previousZoom, nextZoom);
      input.applyCameraBounds();
    },
    onTouchStart: handlePinchZoom,
    onTouchMove: handlePinchZoom,
    onTouchEnd: handlePinchZoom,
    onTouchCancel: () => {
      pinchDistanceRef.current = null;
    },
  };
}

