// src/services/story/resolve-story-primary-action.ts - Define la acción primaria de UI según tipo de nodo y naturaleza virtual.
import { resolveStoryNodeInteraction } from "@/core/services/story/world/resolve-story-node-interaction";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryActTransitionTarget } from "@/services/story/resolve-story-act-transition-target";

export type StoryPrimaryActionMode = "ROUTE" | "VIRTUAL_INTERACTION" | "DISABLED";

export interface IStoryPrimaryAction {
  label: string;
  mode: StoryPrimaryActionMode;
  isEnabled: boolean;
}

/**
 * Traduce un nodo runtime a intención de acción de UI sin mezclar navegación con render.
 */
export function resolveStoryPrimaryAction(node: IStoryMapNodeRuntime | null): IStoryPrimaryAction {
  if (!node) return { label: "Selecciona un nodo", mode: "DISABLED", isEnabled: false };
  if (!node.isUnlocked) return { label: "Nodo bloqueado", mode: "DISABLED", isEnabled: false };
  const actTransitionTarget = resolveStoryActTransitionTarget(node.id);
  if (actTransitionTarget !== null) {
    return { label: `Ir al Acto ${actTransitionTarget}`, mode: "VIRTUAL_INTERACTION", isEnabled: true };
  }
  if (node.isCompleted) return { label: "Nodo resuelto", mode: "DISABLED", isEnabled: false };
  if (node.isVirtualNode && node.nodeType === "MOVE") {
    return { label: "Posición actual", mode: "DISABLED", isEnabled: false };
  }
  const interaction = resolveStoryNodeInteraction({ nodeType: node.nodeType });
  if (node.isVirtualNode || node.href === "#") {
    return { label: interaction.actionLabel, mode: "VIRTUAL_INTERACTION", isEnabled: true };
  }
  return { label: interaction.actionLabel, mode: "ROUTE", isEnabled: true };
}
