// src/core/use-cases/story/internal/assert-valid-story-node-id.ts - Valida identificadores de nodo Story para prevenir entradas inválidas.
import { ValidationError } from "@/core/errors/ValidationError";

const STORY_NODE_ID_PATTERN = /^[a-z0-9-]{3,80}$/;

/**
 * Restringe formato de `nodeId` para evitar payloads arbitrarios en capa de aplicación.
 */
export function assertValidStoryNodeId(nodeId: string): void {
  if (!STORY_NODE_ID_PATTERN.test(nodeId)) {
    throw new ValidationError("Identificador de nodo Story inválido.", { nodeId });
  }
}
