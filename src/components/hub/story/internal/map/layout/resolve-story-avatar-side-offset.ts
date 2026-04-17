// src/components/hub/story/internal/map/layout/resolve-story-avatar-side-offset.ts - Resuelve offset lateral del avatar Story para nodos SIDE sin contaminar el componente de mapa.
import { StoryAvatarSideDirection } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";
import { resolveStoryNodeSideOffsetPx } from "@/components/hub/story/internal/map/constants/story-map-geometry";

/**
 * Traduce dirección lateral a desplazamiento XY en píxeles para el token del avatar.
 */
export function resolveStoryAvatarSideOffset(
  visualStance: "CENTER" | "SIDE" | "PORTAL",
  sideDirection: StoryAvatarSideDirection | undefined,
): { x: number; y: number } {
  if (visualStance !== "SIDE") return { x: 0, y: 0 };
  const offset = resolveStoryNodeSideOffsetPx();
  const direction = sideDirection ?? "LEFT";
  if (direction === "RIGHT") return { x: offset, y: 0 };
  if (direction === "UP") return { x: 0, y: -offset };
  if (direction === "DOWN") return { x: 0, y: offset };
  return { x: -offset, y: 0 };
}

