// src/components/hub/story/internal/map/hooks/use-story-circuit-motion.ts - Orquesta motion de avatar y cámara delegando controles/efectos en submódulos cohesivos.
"use client";

import { useRef } from "react";
import { AnimationPlaybackControls, useMotionValue } from "framer-motion";
import { useStoryCircuitMotionControls } from "./internal/use-story-circuit-motion-controls";
import { useStoryCircuitMotionEffects } from "./internal/use-story-circuit-motion-effects";
import { IUseStoryCircuitMotionInput } from "./internal/use-story-circuit-motion-types";

/**
 * Sincroniza animaciones del avatar y cámara con estado de selección/foco del mapa.
 */
export function useStoryCircuitMotion(input: IUseStoryCircuitMotionInput) {
  const refs = {
    hasCenteredCamera: useRef(false),
    hasInitializedAvatarRef: useRef(false),
    hasPlayedActSpawnRef: useRef(false),
    hasAppliedCenterRequestRef: useRef(0),
    hasAppliedActEntryCenterRef: useRef(false),
    avatarAnimRef: useRef<{ x: AnimationPlaybackControls | null; y: AnimationPlaybackControls | null }>({ x: null, y: null }),
    cameraAnimRef: useRef<{ x: AnimationPlaybackControls | null; y: AnimationPlaybackControls | null }>({ x: null, y: null }),
  };
  const values = {
    cameraX: useMotionValue(0),
    cameraY: useMotionValue(0),
    cinematicScale: useMotionValue(1),
    avatarX: useMotionValue(1000),
    avatarY: useMotionValue(1000),
    avatarScale: useMotionValue(1),
  };
  const controls = useStoryCircuitMotionControls(input, refs, values);
  useStoryCircuitMotionEffects({
    runtime: input,
    refs,
    values,
    centerCameraOnAvatarNode: controls.centerCameraOnAvatarNode,
    centerCameraOnPortalNode: controls.centerCameraOnPortalNode,
  });

  return {
    cameraX: values.cameraX,
    cameraY: values.cameraY,
    cinematicScale: values.cinematicScale,
    avatarX: values.avatarX,
    avatarY: values.avatarY,
    avatarScale: values.avatarScale,
    centerCameraOnAvatarNode: controls.centerCameraOnAvatarNode,
    keepCameraCenterOnZoom: controls.keepCameraCenterOnZoom,
  };
}

