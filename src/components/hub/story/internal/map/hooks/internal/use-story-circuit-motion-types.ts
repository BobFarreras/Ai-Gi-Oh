// src/components/hub/story/internal/map/hooks/internal/use-story-circuit-motion-types.ts - Tipos compartidos del runtime de motion/cámara para el mapa Story.
import { MutableRefObject, RefObject } from "react";
import { AnimationPlaybackControls, MotionValue } from "framer-motion";

export type IAvatarStance = "CENTER" | "SIDE" | "PORTAL";

export interface IUseStoryCircuitMotionInput {
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

export interface IStoryCircuitMotionRefs {
  hasCenteredCamera: MutableRefObject<boolean>;
  hasInitializedAvatarRef: MutableRefObject<boolean>;
  hasPlayedActSpawnRef: MutableRefObject<boolean>;
  hasAppliedCenterRequestRef: MutableRefObject<number>;
  hasAppliedActEntryCenterRef: MutableRefObject<boolean>;
  avatarAnimRef: MutableRefObject<{
    x: AnimationPlaybackControls | null;
    y: AnimationPlaybackControls | null;
  }>;
  cameraAnimRef: MutableRefObject<{
    x: AnimationPlaybackControls | null;
    y: AnimationPlaybackControls | null;
  }>;
}

export interface IStoryCircuitMotionValues {
  cameraX: MotionValue<number>;
  cameraY: MotionValue<number>;
  cinematicScale: MotionValue<number>;
  avatarX: MotionValue<number>;
  avatarY: MotionValue<number>;
  avatarScale: MotionValue<number>;
}
