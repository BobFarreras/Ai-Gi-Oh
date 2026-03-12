// src/services/story/resolve-story-smart-action.ts - Resuelve la acción única del botón Story según nodo, movimiento posible y acción primaria.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStoryPrimaryAction } from "@/services/story/resolve-story-primary-action";

export type StorySmartActionMode = "MOVE" | "PRIMARY" | "MOVE_AND_PRIMARY" | "DISABLED";

export interface IStorySmartAction {
  label: string;
  mode: StorySmartActionMode;
  isEnabled: boolean;
}

/**
 * Calcula una acción única de UX para evitar dos botones y mantener flujo intuitivo.
 */
export function resolveStorySmartAction(input: {
  selectedNode: IStoryMapNodeRuntime | null;
  canMove: boolean;
  primaryAction: IStoryPrimaryAction;
}): IStorySmartAction {
  const { selectedNode, canMove, primaryAction } = input;
  if (!selectedNode) return { label: "Selecciona un nodo", mode: "DISABLED", isEnabled: false };
  if (canMove && primaryAction.isEnabled) {
    const label = primaryAction.mode === "ROUTE" ? "Mover y entrar al duelo" : `Mover y ${primaryAction.label.toLowerCase()}`;
    return { label, mode: "MOVE_AND_PRIMARY", isEnabled: true };
  }
  if (canMove) return { label: "Moverse a nodo", mode: "MOVE", isEnabled: true };
  if (primaryAction.isEnabled) return { label: primaryAction.label, mode: "PRIMARY", isEnabled: true };
  return { label: primaryAction.label, mode: "DISABLED", isEnabled: false };
}
