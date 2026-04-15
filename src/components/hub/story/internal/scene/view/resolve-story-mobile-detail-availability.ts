// src/components/hub/story/internal/scene/view/resolve-story-mobile-detail-availability.ts - Decide si el panel de detalle móvil aporta información útil para el nodo seleccionado.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

/**
 * En móvil se evita abrir detalle para plataformas de tránsito vacías (MOVE) porque no añade contexto útil.
 */
export function resolveStoryMobileDetailAvailability(selectedNode: IStoryMapNodeRuntime | null): boolean {
  if (!selectedNode) return false;
  return selectedNode.nodeType !== "MOVE";
}

