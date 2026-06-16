// src/components/hub/internal/use-hub-scene-tour-integration.ts - Integra el tour guiado con la navegación de nodos del Hub.
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { useHubTour } from "@/components/hub/guided-tour/internal/use-hub-tour";
import { savePlayerOnboardingAction } from "@/components/hub/onboarding/internal/save-player-onboarding-action";

interface IUseHubSceneTourIntegrationInput {
  completedTutorialNodeIds?: readonly string[];
  hasSkippedTutorial?: boolean;
  nodes: readonly IHubMapNode[];
  requestNavigation: (nodeId: string, href: string) => void;
  navigationStatus: string;
  playNodeHover: () => void;
}

export interface IUseHubSceneTourIntegrationOutput {
  isTourActive: boolean;
  activeNodeId: string | null;
  disabledNodeIds: readonly string[];
  handleNodeNavigate: (nodeId: string, href: string) => void;
  tourOverlayProps: {
    isActive: boolean;
    currentStep: ReturnType<typeof useHubTour>["currentStep"];
    uiPhase: ReturnType<typeof useHubTour>["uiPhase"];
    onSkip: () => void;
    onStartCombat: () => void;
    onCloseStorySimulation: () => void;
  };
}

/**
 * Conecta el estado del tour con la navegación real del Hub: desactiva nodos,
 * intercepta el clic en el nodo activo y dispara la transición de cámara.
 */
export function useHubSceneTourIntegration({
  completedTutorialNodeIds,
  hasSkippedTutorial,
  nodes,
  requestNavigation,
  navigationStatus,
  playNodeHover,
}: IUseHubSceneTourIntegrationInput): IUseHubSceneTourIntegrationOutput {
  const router = useRouter();
  const hasTourData = completedTutorialNodeIds !== undefined;

  const handleSkip = useCallback(async () => {
    try {
      await savePlayerOnboardingAction("skip_tutorial");
    } finally {
      router.refresh();
    }
  }, [router]);

  const tour = useHubTour({
    initialCompletedNodeIds: completedTutorialNodeIds ?? [],
    isSkipped: Boolean(hasTourData && hasSkippedTutorial),
    nodes,
    onSkip: handleSkip,
    isEnabled: hasTourData,
  });

  const handleNodeNavigate = useCallback(
    (nodeId: string, href: string) => {
      if (tour.isActive && nodeId === tour.activeNodeId) {
        playNodeHover();
        tour.onTourNodeSelect();
        return;
      }
      if (tour.isActive) return;
      requestNavigation(nodeId, href);
    },
    [tour, playNodeHover, requestNavigation],
  );

  useEffect(() => {
    if (tour.uiPhase !== "navigating" || !tour.currentStep || navigationStatus !== "idle") return;
    requestNavigation(tour.currentStep.hubNodeId, `${tour.currentStep.route}?returnTo=hub`);
  }, [tour.uiPhase, tour.currentStep, navigationStatus, requestNavigation]);

  return {
    isTourActive: tour.isActive,
    activeNodeId: tour.activeNodeId,
    disabledNodeIds: tour.disabledNodeIds,
    handleNodeNavigate,
    tourOverlayProps: {
      isActive: tour.isActive,
      currentStep: tour.currentStep,
      uiPhase: tour.uiPhase,
      onSkip: tour.onSkip,
      onStartCombat: () => {
        if (tour.currentStep) router.push(`${tour.currentStep.route}?returnTo=hub`);
      },
      onCloseStorySimulation: tour.closeStorySimulation,
    },
  };
}
