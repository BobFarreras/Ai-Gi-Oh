// src/components/hub/internal/hub-node-interaction.ts - Resuelve la acción de interacción para nodos de Hub según estado de bloqueo.
import { IHubSection } from "@/core/entities/hub/IHubSection";

export type HubNodeInteractionResult =
  | { kind: "locked" }
  | { kind: "navigate"; href: string };

export function resolveHubNodeInteraction(section: IHubSection): HubNodeInteractionResult {
  if (section.isLocked) return { kind: "locked" };
  return { kind: "navigate", href: section.href };
}
