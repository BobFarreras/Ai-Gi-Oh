// src/services/story/map-definitions/story-map-definition-registry.ts - Registro único de definiciones visuales Story por acto.
import { storyAct1MapDefinition } from "@/services/story/map-definitions/act-1-map-definition";
import { storyAct2MapDefinition } from "@/services/story/map-definitions/act-2-map-definition";
import {
  IStoryActMapDefinition,
  IStoryMapVirtualNodeDefinition,
  IStoryMapVisualNodeDefinition,
} from "@/services/story/map-definitions/story-map-definition-types";

const storyActDefinitions: IStoryActMapDefinition[] = [storyAct1MapDefinition, storyAct2MapDefinition];

/**
 * Devuelve todas las definiciones visuales de actos disponibles localmente.
 */
export function listStoryActMapDefinitions(): IStoryActMapDefinition[] {
  return storyActDefinitions;
}

/**
 * Busca la definición visual de un nodo por `id`.
 */
export function findStoryVisualNodeDefinition(nodeId: string): IStoryMapVisualNodeDefinition | null {
  for (const actDefinition of storyActDefinitions) {
    const nodeDefinition = actDefinition.nodes.find((node) => node.id === nodeId);
    if (nodeDefinition) return nodeDefinition;
  }
  return null;
}

/**
 * Busca un nodo virtual de interacción por `id`.
 */
export function findStoryVirtualNodeDefinition(nodeId: string): IStoryMapVirtualNodeDefinition | null {
  for (const actDefinition of storyActDefinitions) {
    const virtualNode = (actDefinition.virtualNodes ?? []).find((node) => node.id === nodeId);
    if (virtualNode) return virtualNode;
  }
  return null;
}

/**
 * Resuelve el acto al que pertenece un nodo visual o virtual.
 */
export function resolveStoryActByNodeId(nodeId: string): number | null {
  for (const actDefinition of storyActDefinitions) {
    const hasVisualNode = actDefinition.nodes.some((node) => node.id === nodeId);
    if (hasVisualNode) return actDefinition.act;
    const hasVirtualNode = (actDefinition.virtualNodes ?? []).some((node) => node.id === nodeId);
    if (hasVirtualNode) return actDefinition.act;
  }
  return null;
}

/**
 * Lista ids de nodos configurados para un acto (visuales + virtuales).
 */
export function listStoryActNodeIds(act: number): string[] {
  const definition = storyActDefinitions.find((entry) => entry.act === act);
  if (!definition) return [];
  const visualNodeIds = definition.nodes.map((node) => node.id);
  const virtualNodeIds = (definition.virtualNodes ?? []).map((node) => node.id);
  return [...visualNodeIds, ...virtualNodeIds];
}
