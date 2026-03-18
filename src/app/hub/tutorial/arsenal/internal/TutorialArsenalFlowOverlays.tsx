// src/app/hub/tutorial/arsenal/internal/TutorialArsenalFlowOverlays.tsx - Renderiza overlays del flujo guiado de Preparar Deck (guard, spotlight, intro, diálogo y cierre).
"use client";
import { TutorialBigLogDialog } from "@/components/tutorial/flow/TutorialBigLogDialog";
import { TutorialBigLogIntroOverlay } from "@/components/tutorial/flow/TutorialBigLogIntroOverlay";
import { TutorialBigLogOutroOverlay } from "@/components/tutorial/flow/TutorialBigLogOutroOverlay";
import { TutorialInteractionGuard } from "@/components/tutorial/flow/TutorialInteractionGuard";
import { TutorialSpotlightOverlay } from "@/components/tutorial/flow/TutorialSpotlightOverlay";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";
import { HubModuleSfxId } from "@/components/hub/internal/use-hub-module-sfx";

interface ITutorialArsenalFlowOverlaysProps {
  isIntroVisible: boolean;
  setIsIntroVisible: (isVisible: boolean) => void;
  tutorial: ReturnType<typeof useTutorialFlowController>;
  shouldPreferTopTutorialDialog: boolean;
  isEvolutionOverlayVisible: boolean;
  playSfx: (id: HubModuleSfxId) => void;
}

/**
 * Aísla la capa de overlays tutorial para mantener el cliente principal del nodo liviano.
 */
export function TutorialArsenalFlowOverlays(props: ITutorialArsenalFlowOverlaysProps) {
  return (
    <>
      <TutorialInteractionGuard
        isEnabled={props.isIntroVisible || !props.tutorial.isFinished}
        allowedTargetIds={props.isIntroVisible ? [] : props.tutorial.allowedTargetIds}
      />
      <TutorialSpotlightOverlay
        isVisible={!props.isIntroVisible && !props.tutorial.isFinished}
        targetId={props.tutorial.currentStep?.targetId ?? null}
      />
      <TutorialBigLogIntroOverlay
        isVisible={props.isIntroVisible}
        title="Preparar Deck"
        description="Practicarás con un mazo sandbox visual: revisar detalle, gestionar cupo de 20 cartas, entender fusión y dominar evolución por copias."
        onStart={() => {
          props.playSfx("EVOLUTION_BUTTON");
          props.setIsIntroVisible(false);
        }}
      />
      {!props.isIntroVisible && !props.tutorial.isFinished ? (
        <TutorialBigLogDialog
          title={props.tutorial.currentStep?.title ?? "Nodo completado"}
          description={props.tutorial.currentStep?.description ?? "Has completado Preparar Deck. Vuelve al mapa para continuar."}
          canUseNext={props.tutorial.canUseNext}
          isFinished={props.tutorial.isFinished}
          onNext={() => {
            props.playSfx("EVOLUTION_BUTTON");
            props.tutorial.onNext();
          }}
          targetId={props.tutorial.currentStep?.targetId ?? null}
          preferTopPlacement={props.shouldPreferTopTutorialDialog}
          forceBottomPlacement={props.isEvolutionOverlayVisible}
        />
      ) : null}
      <TutorialBigLogOutroOverlay
        isVisible={!props.isIntroVisible && props.tutorial.isFinished}
        title="Preparar Deck Completado"
        description="Ya dominas fundamentos de Arsenal. Elige continuar con el siguiente tutorial o volver al mapa."
        onContinue={() => {
          props.playSfx("EVOLUTION_BUTTON");
          window.location.assign("/hub/tutorial/market");
        }}
        onExit={() => {
          props.playSfx("DIALOG_CLOSE");
          window.location.assign("/hub/tutorial");
        }}
      />
    </>
  );
}
