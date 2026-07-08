// src/core/services/story/overworld/interaction-rules.ts - Reglas puras de resolución de estado y puertas del overworld Story.
import {
  IOverworldGate,
  IOverworldProgressState,
} from "@/core/services/story/overworld/overworld-types";

/**
 * Un requisito se considera resuelto si aparece en cualquiera de los tres ejes de progreso.
 * Mantiene la semántica actual de Story: MOVE→visited, DUEL/BOSS→completed, EVENT/REWARD→interacted.
 */
export function isRequirementSatisfied(
  requiredNodeId: string,
  progress: IOverworldProgressState,
): boolean {
  return (
    progress.visitedNodeIds.has(requiredNodeId) ||
    progress.interactedNodeIds.has(requiredNodeId) ||
    progress.completedNodeIds.has(requiredNodeId)
  );
}

/**
 * Una puerta está abierta cuando todos sus requisitos están resueltos.
 * Una puerta sin requisitos se considera siempre abierta.
 */
export function isGateOpen(gate: IOverworldGate, progress: IOverworldProgressState): boolean {
  return gate.requiredNodeIds.every((requiredNodeId) =>
    isRequirementSatisfied(requiredNodeId, progress),
  );
}

/**
 * Devuelve los requisitos pendientes de una puerta, en orden estable, para mensajería de UI.
 */
export function listGateMissingRequirements(
  gate: IOverworldGate,
  progress: IOverworldProgressState,
): string[] {
  return gate.requiredNodeIds.filter(
    (requiredNodeId) => !isRequirementSatisfied(requiredNodeId, progress),
  );
}
