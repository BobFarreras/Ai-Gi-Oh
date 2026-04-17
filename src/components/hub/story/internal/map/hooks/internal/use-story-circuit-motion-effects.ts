// src/components/hub/story/internal/map/hooks/internal/use-story-circuit-motion-effects.ts - Efectos de sincronización de avatar/cámara del circuito Story.
import { useEffect, useLayoutEffect } from "react";
import { animate } from "framer-motion";
import { resolveStoryNodeTokenAnchor } from "@/components/hub/story/internal/map/layout/story-circuit-layout";
import { resolveStoryCameraCenterTarget } from "@/components/hub/story/internal/map/layout/story-circuit-map-geometry";
import { IUseStoryCircuitMotionInput, IStoryCircuitMotionRefs, IStoryCircuitMotionValues } from "./use-story-circuit-motion-types";

/**
 * Conecta MotionValues con cambios de estado (entrada de acto, foco de duelo y desplazamiento).
 */
export function useStoryCircuitMotionEffects(input: {
  runtime: IUseStoryCircuitMotionInput;
  refs: IStoryCircuitMotionRefs;
  values: IStoryCircuitMotionValues;
  centerCameraOnAvatarNode: (zoomValue?: number, resetZoom?: boolean, animated?: boolean) => void;
  centerCameraOnPortalNode: (zoomValue?: number, resetZoom?: boolean, animated?: boolean) => void;
}) {
  const { runtime, refs, values, centerCameraOnAvatarNode, centerCameraOnPortalNode } = input;
  const {
    hasCenteredCamera: hasCenteredCameraRef,
    hasInitializedAvatarRef,
    hasPlayedActSpawnRef,
    hasAppliedCenterRequestRef,
    hasAppliedActEntryCenterRef,
    avatarAnimRef,
    cameraAnimRef,
  } = refs;

  useLayoutEffect(() => {
    if (hasInitializedAvatarRef.current) return;
    values.avatarX.set(runtime.avatarPos.x);
    values.avatarY.set(runtime.avatarPos.y);
    hasInitializedAvatarRef.current = true;
  }, [hasInitializedAvatarRef, runtime.avatarPos.x, runtime.avatarPos.y, values.avatarX, values.avatarY]);

  useEffect(() => {
    if (!hasInitializedAvatarRef.current) return;
    if (runtime.visualStance === "PORTAL") {
      avatarAnimRef.current.x?.stop();
      avatarAnimRef.current.y?.stop();
      values.avatarX.set(runtime.avatarPos.x);
      values.avatarY.set(runtime.avatarPos.y);
      return;
    }
    const avatarTravelDistance = Math.hypot(runtime.avatarPos.x - values.avatarX.get(), runtime.avatarPos.y - values.avatarY.get());
    if (avatarTravelDistance < 0.75) return;
    const duration = Math.min(1.0, Math.max(0.38, avatarTravelDistance / 640));
    avatarAnimRef.current.x?.stop();
    avatarAnimRef.current.y?.stop();
    avatarAnimRef.current.x = animate(values.avatarX, runtime.avatarPos.x, { duration, ease: "easeInOut" });
    avatarAnimRef.current.y = animate(values.avatarY, runtime.avatarPos.y, { duration, ease: "easeInOut" });
    if (runtime.mapContainerRef.current && hasCenteredCameraRef.current && !runtime.duelFocusNodeId) {
      const target = resolveStoryCameraCenterTarget({
        containerWidth: runtime.mapContainerRef.current.clientWidth,
        containerHeight: runtime.mapContainerRef.current.clientHeight,
        nodePosition: runtime.avatarAnchor,
        scale: runtime.zoom.get() * values.cinematicScale.get(),
      });
      cameraAnimRef.current.x?.stop();
      cameraAnimRef.current.y?.stop();
      cameraAnimRef.current.x = animate(values.cameraX, target.x, { duration, ease: "easeInOut" });
      cameraAnimRef.current.y = animate(values.cameraY, target.y, { duration, ease: "easeInOut" });
    }
  }, [avatarAnimRef, cameraAnimRef, hasCenteredCameraRef, hasInitializedAvatarRef, runtime, values]);

  useEffect(() => {
    const controls = animate(values.avatarScale, runtime.visualStance === "PORTAL" ? 0.02 : 1, { duration: 0.52, ease: "easeInOut" });
    return () => controls.stop();
  }, [runtime.visualStance, values.avatarScale]);

  useEffect(() => {
    if (!runtime.shouldPlayActEntryAnimation || hasPlayedActSpawnRef.current) return;
    hasPlayedActSpawnRef.current = true;
    values.avatarScale.set(0.4);
    const controls = animate(values.avatarScale, 1, { duration: 0.34, ease: "easeOut" });
    return () => controls.stop();
  }, [hasPlayedActSpawnRef, runtime.shouldPlayActEntryAnimation, values.avatarScale]);

  useEffect(() => {
    if (!runtime.duelFocusNodeId || !runtime.mapContainerRef.current) return;
    const focus = resolveStoryNodeTokenAnchor(runtime.duelFocusNodeId, runtime.positionMap);
    const midpoint = runtime.currentNodeAnchor
      ? {
          x: (focus.x + runtime.currentNodeAnchor.x) / 2,
          y: (focus.y + runtime.currentNodeAnchor.y) / 2,
        }
      : focus;
    const target = resolveStoryCameraCenterTarget({
      containerWidth: runtime.mapContainerRef.current.clientWidth,
      containerHeight: runtime.mapContainerRef.current.clientHeight,
      nodePosition: midpoint,
      scale: runtime.zoom.get() * values.cinematicScale.get(),
    });
    const xControls = animate(values.cameraX, target.x, { duration: 0.38, ease: "easeInOut" });
    const yControls = animate(values.cameraY, target.y, { duration: 0.38, ease: "easeInOut" });
    const scaleControls = animate(values.cinematicScale, 1.08, { duration: 0.35, ease: "easeOut" });
    return () => { xControls.stop(); yControls.stop(); scaleControls.stop(); };
  }, [runtime.currentNodeAnchor, runtime.duelFocusNodeId, runtime.mapContainerRef, runtime.positionMap, runtime.zoom, values.cameraX, values.cameraY, values.cinematicScale]);

  useEffect(() => {
    if (!runtime.mapContainerRef.current || hasCenteredCameraRef.current) return;
    centerCameraOnAvatarNode(runtime.zoom.get(), false, false);
    hasCenteredCameraRef.current = true;
  }, [centerCameraOnAvatarNode, hasCenteredCameraRef, runtime.currentNodeAnchor, runtime.mapContainerRef, runtime.zoom]);

  useEffect(() => {
    if (!hasCenteredCameraRef.current) return;
    const nextCenterRequestKey = runtime.centerRequestKey ?? 0;
    if (nextCenterRequestKey === hasAppliedCenterRequestRef.current) return;
    hasAppliedCenterRequestRef.current = nextCenterRequestKey;
    centerCameraOnAvatarNode();
  }, [centerCameraOnAvatarNode, hasAppliedCenterRequestRef, hasCenteredCameraRef, runtime.centerRequestKey]);

  useEffect(() => {
    if (!runtime.shouldPlayActEntryAnimation) {
      hasAppliedActEntryCenterRef.current = false;
      return;
    }
    if (runtime.visualStance !== "PORTAL" || hasAppliedActEntryCenterRef.current) return;
    hasAppliedActEntryCenterRef.current = true;
    centerCameraOnPortalNode(runtime.zoom.get(), true, true);
  }, [centerCameraOnPortalNode, hasAppliedActEntryCenterRef, runtime.shouldPlayActEntryAnimation, runtime.visualStance, runtime.zoom]);
}
