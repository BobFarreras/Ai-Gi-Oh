// src/core/entities/tutorial/ITutorialFlowStep.ts - Contratos del motor de pasos tutorial con avance manual o por acción.
export type TutorialStepCompletionType = "MANUAL_NEXT" | "USER_ACTION" | "BOTH";

export interface ITutorialFlowStep {
  id: string;
  title: string;
  description: string;
  targetId: string;
  allowedTargetIds: string[];
  completionType: TutorialStepCompletionType;
  expectedActionId?: string;
}

export interface ITutorialFlowState {
  currentStepIndex: number;
  completedStepIds: string[];
  isFinished: boolean;
}
