// src/components/hub/academy/tutorial/internal/resolve-prepare-deck-guide-visibility.ts - Calcula si debe mostrarse la guía inicial de BigLog en el mapa tutorial.
import { ITutorialMapNodeRuntime } from "@/core/entities/tutorial/ITutorialMapNode";

/**
 * Muestra la guía mientras el nodo inicial de Preparar Deck no esté completado.
 */
export function resolvePrepareDeckGuideVisibility(nodes: ITutorialMapNodeRuntime[]): boolean {
  const prepareDeckNode = nodes.find((node) => node.id === "tutorial-arsenal-basics");
  return prepareDeckNode?.state !== "COMPLETED";
}
