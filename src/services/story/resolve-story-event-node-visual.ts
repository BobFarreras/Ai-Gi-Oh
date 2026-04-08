// src/services/story/resolve-story-event-node-visual.ts - Resuelve iconografía y visuales de recogida para nodos EVENT de Story.
import { resolveStoryActTransitionTarget } from "@/services/story/resolve-story-act-transition-target";

interface IStoryEventNodeVisual {
  assetSrc: string;
  assetAlt: string;
}

const STORY_EVENT_NODE_VISUAL_BY_ID: Record<string, IStoryEventNodeVisual> = {
  "story-ch2-branch-lower-up-event": {
    assetSrc: "/assets/story/llave-1.webp",
    assetAlt: "Llave de enlace",
  },
  "story-ch2-link-recovered-event": {
    assetSrc: "/assets/story/llave-2.webp",
    assetAlt: "Llave de enlace recuperada",
  },
};

const DEFAULT_EVENT_VISUAL: IStoryEventNodeVisual = {
  assetSrc: "/assets/renders/discord.webp",
  assetAlt: "Evento de diálogo",
};

/**
 * Devuelve el icono visual del nodo EVENT para mapa/diálogo.
 */
export function resolveStoryEventNodeVisual(nodeId: string): IStoryEventNodeVisual {
  return STORY_EVENT_NODE_VISUAL_BY_ID[nodeId] ?? DEFAULT_EVENT_VISUAL;
}

/**
 * Define si el evento debe lanzar animación de recogida al cerrarse.
 */
export function shouldPlayStoryEventCollectAnimation(nodeId: string): boolean {
  return resolveStoryActTransitionTarget(nodeId) === null;
}
