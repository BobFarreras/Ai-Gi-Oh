// src/components/hub/story/internal/map/hooks/internal/use-story-circuit-motion-controls.ts - Controles de centrado y zoom de cámara para circuito Story.
import { useCallback } from "react";
import { animate } from "framer-motion";
import { resolveStoryCameraCenterTarget } from "@/components/hub/story/internal/map/layout/story-circuit-map-geometry";
import { IUseStoryCircuitMotionInput, IStoryCircuitMotionRefs, IStoryCircuitMotionValues } from "./use-story-circuit-motion-types";

/**
 * Expone callbacks de cámara reutilizables para eventos UI y efectos de animación.
 */
export function useStoryCircuitMotionControls(
  input: IUseStoryCircuitMotionInput,
  refs: IStoryCircuitMotionRefs,
  values: IStoryCircuitMotionValues,
) {
  const centerCameraOnAvatarNode = useCallback((zoomValue = input.zoom.get(), resetZoom = true, animated = true) => {
    if (!input.mapContainerRef.current) return;
    const anchor = input.currentNodeAnchor ?? input.avatarAnchor;
    const effectiveZoom = resetZoom ? 1 : zoomValue;
    const target = resolveStoryCameraCenterTarget({
      containerWidth: input.mapContainerRef.current.clientWidth,
      containerHeight: input.mapContainerRef.current.clientHeight,
      nodePosition: anchor,
      scale: effectiveZoom * values.cinematicScale.get(),
    });
    refs.cameraAnimRef.current.x?.stop();
    refs.cameraAnimRef.current.y?.stop();
    if (animated) {
      refs.cameraAnimRef.current.x = animate(values.cameraX, target.x, { duration: 0.34, ease: "easeInOut" });
      refs.cameraAnimRef.current.y = animate(values.cameraY, target.y, { duration: 0.34, ease: "easeInOut" });
    } else {
      values.cameraX.set(target.x);
      values.cameraY.set(target.y);
    }
    if (resetZoom) {
      input.setZoom(1);
      animate(values.cinematicScale, 1, { duration: 0.28, ease: "easeOut" });
    }
  }, [input, refs.cameraAnimRef, values.cameraX, values.cameraY, values.cinematicScale]);

  const centerCameraOnPortalNode = useCallback((zoomValue = input.zoom.get(), resetZoom = true, animated = true) => {
    if (!input.mapContainerRef.current) return;
    const effectiveZoom = resetZoom ? 1 : zoomValue;
    const target = resolveStoryCameraCenterTarget({
      containerWidth: input.mapContainerRef.current.clientWidth,
      containerHeight: input.mapContainerRef.current.clientHeight,
      nodePosition: input.avatarAnchor,
      scale: effectiveZoom * values.cinematicScale.get(),
    });
    refs.cameraAnimRef.current.x?.stop();
    refs.cameraAnimRef.current.y?.stop();
    if (animated) {
      refs.cameraAnimRef.current.x = animate(values.cameraX, target.x, { duration: 0.4, ease: "easeInOut" });
      refs.cameraAnimRef.current.y = animate(values.cameraY, target.y, { duration: 0.4, ease: "easeInOut" });
    } else {
      values.cameraX.set(target.x);
      values.cameraY.set(target.y);
    }
    if (resetZoom) {
      input.setZoom(1);
      animate(values.cinematicScale, 1, { duration: 0.3, ease: "easeOut" });
    }
  }, [input, refs.cameraAnimRef, values.cameraX, values.cameraY, values.cinematicScale]);

  const keepCameraCenterOnZoom = useCallback((previousZoom: number, nextZoom: number) => {
    if (!input.mapContainerRef.current) return;
    const previousScale = previousZoom * values.cinematicScale.get();
    const nextScale = nextZoom * values.cinematicScale.get();
    if (previousScale <= 0 || nextScale <= 0) return;
    const centerX = input.mapContainerRef.current.clientWidth / 2;
    const centerY = input.mapContainerRef.current.clientHeight / 2;
    const ratio = nextScale / previousScale;
    values.cameraX.set(centerX - (centerX - values.cameraX.get()) * ratio);
    values.cameraY.set(centerY - (centerY - values.cameraY.get()) * ratio);
  }, [input.mapContainerRef, values.cameraX, values.cameraY, values.cinematicScale]);

  return {
    centerCameraOnAvatarNode,
    centerCameraOnPortalNode,
    keepCameraCenterOnZoom,
  };
}

