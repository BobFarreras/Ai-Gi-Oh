// src/components/hub/story/internal/map/hooks/use-story-circuit-motion.ts - Agrupa motion/cámara/avatar del mapa Story para mantener StoryCircuitMap con foco en composición.
"use client";

import { RefObject, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { animate, AnimationPlaybackControls, useMotionValue } from "framer-motion";
import { resolveStoryNodeTokenAnchor } from "@/components/hub/story/internal/map/layout/story-circuit-layout";
import { resolveStoryCameraCenterTarget } from "@/components/hub/story/internal/map/layout/story-circuit-map-geometry";

type IAvatarStance = "CENTER" | "SIDE" | "PORTAL";

interface IUseStoryCircuitMotionInput {
  mapContainerRef: RefObject<HTMLDivElement | null>;
  avatarPos: { x: number; y: number };
  avatarAnchor: { x: number; y: number };
  currentNodeAnchor: { x: number; y: number } | null;
  positionMap: Record<string, { x: number; y: number }>;
  duelFocusNodeId?: string | null;
  centerRequestKey?: number;
  shouldPlayActEntryAnimation?: boolean;
  visualStance: IAvatarStance;
  zoom: { get: () => number; set: (value: number) => void };
  setZoom: (next: number) => void;
}

/**
 * Sincroniza animaciones del avatar y cámara con estado de selección/foco del mapa.
 */
export function useStoryCircuitMotion(input: IUseStoryCircuitMotionInput) {
  const {
    mapContainerRef,
    avatarPos,
    avatarAnchor,
    currentNodeAnchor,
    positionMap,
    duelFocusNodeId,
    centerRequestKey,
    shouldPlayActEntryAnimation,
    visualStance,
    zoom,
    setZoom,
  } = input;
  const hasCenteredCamera = useRef(false);
  const hasInitializedAvatarRef = useRef(false);
  const hasPlayedActSpawnRef = useRef(false);
  const hasAppliedCenterRequestRef = useRef(0);
  const avatarAnimRef = useRef<{ x: AnimationPlaybackControls | null; y: AnimationPlaybackControls | null }>({ x: null, y: null });
  const cameraAnimRef = useRef<{ x: AnimationPlaybackControls | null; y: AnimationPlaybackControls | null }>({ x: null, y: null });
  const cameraX = useMotionValue(0);
  const cameraY = useMotionValue(0);
  const cinematicScale = useMotionValue(1);
  const avatarX = useMotionValue(1000);
  const avatarY = useMotionValue(1000);
  const avatarScale = useMotionValue(1);

  const centerCameraOnAvatarNode = useCallback((zoomValue = zoom.get(), resetZoom = true, animated = true) => {
    if (!mapContainerRef.current) return;
    const anchor = currentNodeAnchor ?? avatarAnchor;
    const effectiveZoom = resetZoom ? 1 : zoomValue;
    const target = resolveStoryCameraCenterTarget({
      containerWidth: mapContainerRef.current.clientWidth,
      containerHeight: mapContainerRef.current.clientHeight,
      nodePosition: anchor,
      scale: effectiveZoom * cinematicScale.get(),
    });
    cameraAnimRef.current.x?.stop();
    cameraAnimRef.current.y?.stop();
    if (animated) {
      cameraAnimRef.current.x = animate(cameraX, target.x, { duration: 0.34, ease: "easeInOut" });
      cameraAnimRef.current.y = animate(cameraY, target.y, { duration: 0.34, ease: "easeInOut" });
    } else {
      cameraX.set(target.x);
      cameraY.set(target.y);
    }
    if (resetZoom) {
      setZoom(1);
      animate(cinematicScale, 1, { duration: 0.28, ease: "easeOut" });
    }
  }, [avatarAnchor, cameraX, cameraY, cinematicScale, currentNodeAnchor, mapContainerRef, setZoom, zoom]);

  const keepCameraCenterOnZoom = useCallback((previousZoom: number, nextZoom: number) => {
    if (!mapContainerRef.current) return;
    const previousScale = previousZoom * cinematicScale.get();
    const nextScale = nextZoom * cinematicScale.get();
    if (previousScale <= 0 || nextScale <= 0) return;
    const centerX = mapContainerRef.current.clientWidth / 2;
    const centerY = mapContainerRef.current.clientHeight / 2;
    const ratio = nextScale / previousScale;
    cameraX.set(centerX - (centerX - cameraX.get()) * ratio);
    cameraY.set(centerY - (centerY - cameraY.get()) * ratio);
  }, [cameraX, cameraY, cinematicScale, mapContainerRef]);

  useLayoutEffect(() => {
    if (hasInitializedAvatarRef.current) return;
    avatarX.set(avatarPos.x);
    avatarY.set(avatarPos.y);
    hasInitializedAvatarRef.current = true;
  }, [avatarPos.x, avatarPos.y, avatarX, avatarY]);

  useEffect(() => {
    if (!hasInitializedAvatarRef.current) return;
    const duration = Math.min(0.7, Math.max(0.24, Math.hypot(avatarPos.x - avatarX.get(), avatarPos.y - avatarY.get()) / 760));
    avatarAnimRef.current.x?.stop();
    avatarAnimRef.current.y?.stop();
    avatarAnimRef.current.x = animate(avatarX, avatarPos.x, { duration, ease: "easeInOut" });
    avatarAnimRef.current.y = animate(avatarY, avatarPos.y, { duration, ease: "easeInOut" });
    if (mapContainerRef.current && hasCenteredCamera.current && !duelFocusNodeId) {
      const target = resolveStoryCameraCenterTarget({
        containerWidth: mapContainerRef.current.clientWidth,
        containerHeight: mapContainerRef.current.clientHeight,
        nodePosition: avatarAnchor,
        scale: zoom.get() * cinematicScale.get(),
      });
      cameraAnimRef.current.x?.stop();
      cameraAnimRef.current.y?.stop();
      cameraAnimRef.current.x = animate(cameraX, target.x, { duration, ease: "easeInOut" });
      cameraAnimRef.current.y = animate(cameraY, target.y, { duration, ease: "easeInOut" });
    }
  }, [avatarAnchor, avatarPos, avatarX, avatarY, cameraX, cameraY, cinematicScale, duelFocusNodeId, mapContainerRef, zoom]);

  useEffect(() => {
    const controls = animate(avatarScale, visualStance === "PORTAL" ? 0.5 : 1, { duration: 0.22, ease: "easeInOut" });
    return () => controls.stop();
  }, [avatarScale, visualStance]);

  useEffect(() => {
    if (!shouldPlayActEntryAnimation || hasPlayedActSpawnRef.current) return;
    hasPlayedActSpawnRef.current = true;
    avatarScale.set(0.4);
    const controls = animate(avatarScale, 1, { duration: 0.34, ease: "easeOut" });
    return () => controls.stop();
  }, [avatarScale, shouldPlayActEntryAnimation]);

  useEffect(() => {
    if (!duelFocusNodeId || !mapContainerRef.current) return;
    const focus = resolveStoryNodeTokenAnchor(duelFocusNodeId, positionMap);
    const target = resolveStoryCameraCenterTarget({
      containerWidth: mapContainerRef.current.clientWidth,
      containerHeight: mapContainerRef.current.clientHeight,
      nodePosition: focus,
      scale: zoom.get() * cinematicScale.get(),
    });
    const xControls = animate(cameraX, target.x, { duration: 0.38, ease: "easeInOut" });
    const yControls = animate(cameraY, target.y, { duration: 0.38, ease: "easeInOut" });
    const scaleControls = animate(cinematicScale, 1.2, { duration: 0.35, ease: "easeOut" });
    return () => { xControls.stop(); yControls.stop(); scaleControls.stop(); };
  }, [cameraX, cameraY, cinematicScale, duelFocusNodeId, mapContainerRef, positionMap, zoom]);

  useEffect(() => {
    if (!mapContainerRef.current || hasCenteredCamera.current) return;
    centerCameraOnAvatarNode(zoom.get(), false, false);
    hasCenteredCamera.current = true;
  }, [centerCameraOnAvatarNode, currentNodeAnchor, mapContainerRef, zoom]);

  useEffect(() => {
    if (!hasCenteredCamera.current) return;
    const nextCenterRequestKey = centerRequestKey ?? 0;
    if (nextCenterRequestKey === hasAppliedCenterRequestRef.current) return;
    hasAppliedCenterRequestRef.current = nextCenterRequestKey;
    centerCameraOnAvatarNode();
  }, [centerCameraOnAvatarNode, centerRequestKey]);

  return { cameraX, cameraY, cinematicScale, avatarX, avatarY, avatarScale, centerCameraOnAvatarNode, keepCameraCenterOnZoom };
}
