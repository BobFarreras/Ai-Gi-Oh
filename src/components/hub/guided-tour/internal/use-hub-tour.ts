// src/components/hub/guided-tour/internal/use-hub-tour.ts - Hook que orquesta estado, nodos desactivados y navegación del tour guiado.
import { useCallback, useMemo, useState } from "react";
import { HUB_TOUR_STEPS } from "@/core/services/hub/hub-tour-step-catalog";
import { IHubTourState, resolveHubTourState } from "@/core/services/hub/resolve-hub-tour-state";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";

export type HubTourUiPhase = "guiding" | "story-simulation" | "navigating";

interface IUseHubTourInput {
  initialCompletedNodeIds: readonly string[];
  isSkipped: boolean;
  nodes: readonly IHubMapNode[];
  onSkip: () => void;
  isEnabled: boolean;
}

export interface IUseHubTourOutput {
  tourState: IHubTourState;
  currentStep: (typeof HUB_TOUR_STEPS)[number] | null;
  activeNodeId: string | null;
  disabledNodeIds: readonly string[];
  uiPhase: HubTourUiPhase;
  isActive: boolean;
  onTourNodeSelect: () => void;
  onSkip: () => void;
  onRequestNodeNavigationComplete: () => void;
  openStorySimulation: () => void;
  closeStorySimulation: () => void;
  markNavigating: () => void;
}

const INACTIVE_TOUR_STATE: IHubTourState = {
  currentStepId: null,
  completedStepIds: [],
  isFinished: true,
  isSkipped: false,
};

/**
 * Gestiona el estado del tour guiado del Hub y expone qué nodos deben estar
 * desactivados, cuál es el nodo activo y en qué fase de UI se encuentra.
 */
export function useHubTour({ initialCompletedNodeIds, isSkipped, nodes, onSkip, isEnabled }: IUseHubTourInput): IUseHubTourOutput {
  const [tourState] = useState<IHubTourState>(() =>
    isEnabled ? resolveHubTourState({ completedTutorialNodeIds: initialCompletedNodeIds, isSkipped }) : INACTIVE_TOUR_STATE,
  );
  const [uiPhase, setUiPhase] = useState<HubTourUiPhase>("guiding");

  const currentStep = useMemo(
    () => HUB_TOUR_STEPS.find((step) => step.id === tourState.currentStepId) ?? null,
    [tourState.currentStepId],
  );

  const activeNodeId = currentStep?.hubNodeId ?? null;

  const disabledNodeIds = useMemo(() => {
    if (!activeNodeId) return [];
    return nodes.map((node) => node.id).filter((nodeId) => nodeId !== activeNodeId);
  }, [activeNodeId, nodes]);

  const openStorySimulation = useCallback(() => setUiPhase("story-simulation"), []);
  const closeStorySimulation = useCallback(() => setUiPhase("guiding"), []);
  const markNavigating = useCallback(() => setUiPhase("navigating"), []);

  const onTourNodeSelect = useCallback(() => {
    if (!currentStep) return;
    if (currentStep.id === "combat") {
      openStorySimulation();
      return;
    }
    markNavigating();
  }, [currentStep, openStorySimulation, markNavigating]);

  const onRequestNodeNavigationComplete = useCallback(() => {
    // La navegación real la ejecuta HubScene; aquí solo limpiamos la fase si fuera necesario.
    setUiPhase("guiding");
  }, []);

  return {
    tourState,
    currentStep,
    activeNodeId,
    disabledNodeIds,
    uiPhase,
    isActive: !tourState.isFinished && !tourState.isSkipped,
    onTourNodeSelect,
    onSkip,
    onRequestNodeNavigationComplete,
    openStorySimulation,
    closeStorySimulation,
    markNavigating,
  };
}
