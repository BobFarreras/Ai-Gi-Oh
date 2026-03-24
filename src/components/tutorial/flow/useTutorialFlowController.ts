// src/components/tutorial/flow/useTutorialFlowController.ts - Hook reusable para ejecutar flujos tutorial basados en pasos.
"use client";
import { useMemo, useState } from "react";
import { ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";
import { advanceTutorialFlow, createInitialTutorialFlowState } from "@/core/services/tutorial/advance-tutorial-flow";

export function useTutorialFlowController(steps: ITutorialFlowStep[]) {
  const [flowState, setFlowState] = useState(createInitialTutorialFlowState);
  const currentStep = useMemo(() => steps[flowState.currentStepIndex] ?? null, [flowState.currentStepIndex, steps]);

  /**
   * Avanza por botón manual cuando el paso lo permite.
   */
  function handleNext() {
    setFlowState((previous) => advanceTutorialFlow(steps, previous, { type: "NEXT" }));
  }

  /**
   * Avanza por interacción funcional del usuario (click, input, etc.) según actionId.
   */
  function handleAction(actionId: string) {
    setFlowState((previous) => advanceTutorialFlow(steps, previous, { type: "ACTION", actionId }));
  }

  return {
    currentStep,
    isFinished: flowState.isFinished,
    completedStepIds: flowState.completedStepIds,
    canUseNext:
      currentStep?.completionType === "MANUAL_NEXT" ||
      currentStep?.completionType === "BOTH",
    allowedTargetIds: currentStep?.allowedTargetIds ?? [],
    onNext: handleNext,
    onAction: handleAction,
  };
}
