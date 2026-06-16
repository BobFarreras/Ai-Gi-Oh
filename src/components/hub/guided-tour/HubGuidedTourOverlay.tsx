// src/components/hub/guided-tour/HubGuidedTourOverlay.tsx - Overlay UI del tour guiado del Hub: diálogo de BigLog y simulación Story.
import { HubTourBigLogDialog } from "./internal/HubTourBigLogDialog";
import { HubStorySimulationOverlay } from "./internal/HubStorySimulationOverlay";
import { HubTourUiPhase } from "./internal/use-hub-tour";
import { HUB_TOUR_STEPS } from "@/core/services/hub/hub-tour-step-catalog";

interface IHubGuidedTourOverlayProps {
  isActive: boolean;
  currentStep: (typeof HUB_TOUR_STEPS)[number] | null;
  uiPhase: HubTourUiPhase;
  onSkip: () => void;
  onStartCombat: () => void;
  onCloseStorySimulation: () => void;
}

/**
 * Renderiza la interfaz flotante del tour: el diálogo de BigLog que guía al
 * jugador y, para el paso de combate, la simulación del circuito de Story.
 */
export function HubGuidedTourOverlay({
  isActive,
  currentStep,
  uiPhase,
  onSkip,
  onStartCombat,
  onCloseStorySimulation,
}: IHubGuidedTourOverlayProps) {
  if (!isActive) return null;

  return (
    <>
      {uiPhase === "guiding" && currentStep ? (
        <HubTourBigLogDialog
          title={currentStep.title}
          objective={currentStep.bigLogObjective}
          context={currentStep.bigLogContext}
          onSkip={onSkip}
        />
      ) : null}
      <HubStorySimulationOverlay
        isOpen={uiPhase === "story-simulation"}
        onStartCombat={onStartCombat}
        onClose={onCloseStorySimulation}
      />
    </>
  );
}
