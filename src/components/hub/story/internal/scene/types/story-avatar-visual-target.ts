// src/components/hub/story/internal/scene/types/story-avatar-visual-target.ts - Tipo compartido para controlar la pose visual del avatar sobre el mapa Story.
export type StoryAvatarStance = "CENTER" | "SIDE" | "PORTAL";

export type StoryAvatarSideDirection = "LEFT" | "RIGHT" | "UP" | "DOWN";

export interface IStoryAvatarVisualTarget {
  nodeId: string;
  stance: StoryAvatarStance;
  sideDirection?: StoryAvatarSideDirection;
}
