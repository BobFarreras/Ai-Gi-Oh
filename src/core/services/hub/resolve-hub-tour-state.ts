// src/core/services/hub/resolve-hub-tour-state.ts - Resolución pura del estado del tour guiado del Hub.
import { HUB_TOUR_STEPS, HubTourStepId } from "./hub-tour-step-catalog";

export interface IHubTourState {
  currentStepId: HubTourStepId | null;
  completedStepIds: readonly HubTourStepId[];
  isFinished: boolean;
  isSkipped: boolean;
}

interface IResolveHubTourStateInput {
  completedTutorialNodeIds?: readonly string[];
  isSkipped?: boolean;
}

/**
 * Deriva el estado del tour a partir de los nodos tutorial ya completados.
 * No genera efectos secundarios ni depende de React.
 */
export function resolveHubTourState(input: IResolveHubTourStateInput): IHubTourState {
  if (input.isSkipped) {
    return { currentStepId: null, completedStepIds: [], isFinished: true, isSkipped: true };
  }
  const completedNodeIds = new Set(input.completedTutorialNodeIds ?? []);
  const completedStepIds = HUB_TOUR_STEPS.filter((step) => completedNodeIds.has(step.tutorialNodeId)).map((step) => step.id);
  const nextStep = HUB_TOUR_STEPS.find((step) => !completedNodeIds.has(step.tutorialNodeId));

  return {
    currentStepId: nextStep?.id ?? null,
    completedStepIds,
    isFinished: !nextStep,
    isSkipped: false,
  };
}
