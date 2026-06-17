// src/components/hub/guided-tour/HubGuidedTourOverlay.tsx - Overlay UI del tour guiado del Hub: buff narrativo de BigLog y simulación Story.
import { HubTourStepIntroOverlay } from "./internal/HubTourStepIntroOverlay";
import { HubStorySimulationOverlay } from "./internal/HubStorySimulationOverlay";
import { HubTourUiPhase } from "./internal/use-hub-tour";
import { HUB_TOUR_STEPS } from "@/core/services/hub/hub-tour-step-catalog";

interface IHubGuidedTourOverlayProps {
  isActive: boolean;
  currentStep: (typeof HUB_TOUR_STEPS)[number] | null;
  uiPhase: HubTourUiPhase;
  onSkip: () => void;
  onGoFromStepIntro: () => void;
  onStartCombat: () => void;
  onCloseStorySimulation: () => void;
}

/**
 * Renderiza la interfaz del tour: buff narrativo de BigLog al inicio de cada paso
 * y, para el paso de combate, la simulación del circuito de Story.
 */
export function HubGuidedTourOverlay({
  isActive,
  currentStep,
  uiPhase,
  onSkip,
  onGoFromStepIntro,
  onStartCombat,
  onCloseStorySimulation,
}: IHubGuidedTourOverlayProps) {
  if (!isActive) return null;

  return (
    <>
      <HubTourStepIntroOverlay
        isOpen={uiPhase === "step-intro" && currentStep !== null}
        objective={currentStep?.bigLogObjective ?? ""}
        context={currentStep?.bigLogContext ?? ""}
        onGo={onGoFromStepIntro}
        onSkip={onSkip}
      />
      <HubStorySimulationOverlay
        isOpen={uiPhase === "story-simulation"}
        onStartCombat={onStartCombat}
        onClose={onCloseStorySimulation}
      />
    </>
  );
}
