// src/components/hub/academy/tutorial/nodes/internal/resolve-step-id-membership.ts - Centraliza evaluación de pertenencia de stepId para reglas UI de tutorial.
/**
 * Evalúa si el step actual pertenece a un conjunto declarativo de ids.
 */
export function resolveStepIdMembership(currentStepId: string | null, group: readonly string[]): boolean {
  if (!currentStepId) return false;
  return group.includes(currentStepId);
}
