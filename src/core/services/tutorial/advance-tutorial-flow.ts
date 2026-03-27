// src/core/services/tutorial/advance-tutorial-flow.ts - Resuelve transición de pasos del tutorial según eventos de usuario.
import { ITutorialFlowState, ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";

type TutorialFlowEvent = { type: "NEXT" } | { type: "ACTION"; actionId: string };

function canCompleteStep(step: ITutorialFlowStep, event: TutorialFlowEvent): boolean {
  if (step.completionType === "MANUAL_NEXT") return event.type === "NEXT";
  if (step.completionType === "USER_ACTION") return event.type === "ACTION" && event.actionId === step.expectedActionId;
  return event.type === "NEXT" || (event.type === "ACTION" && event.actionId === step.expectedActionId);
}

/**
 * Mantiene una transición determinista para que el motor sea testeable y agnóstico de UI.
 */
export function advanceTutorialFlow(steps: ITutorialFlowStep[], state: ITutorialFlowState, event: TutorialFlowEvent): ITutorialFlowState {
  if (state.isFinished || steps.length === 0) return state;
  const currentStep = steps[state.currentStepIndex];
  if (!currentStep) return { ...state, isFinished: true };
  if (!canCompleteStep(currentStep, event)) return state;
  const completedStepIds = [...state.completedStepIds, currentStep.id];
  const nextStepIndex = state.currentStepIndex + 1;
  return {
    currentStepIndex: nextStepIndex,
    completedStepIds,
    isFinished: nextStepIndex >= steps.length,
  };
}

export function createInitialTutorialFlowState(): ITutorialFlowState {
  return { currentStepIndex: 0, completedStepIds: [], isFinished: false };
}
