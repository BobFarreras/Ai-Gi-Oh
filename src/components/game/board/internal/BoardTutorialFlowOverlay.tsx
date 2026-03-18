// src/components/game/board/internal/BoardTutorialFlowOverlay.tsx - Overlay narrativo de BigLog para tutorial de combate con avance por eventos reales.
"use client";
import { useEffect, useMemo } from "react";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { TutorialBigLogDialog } from "@/components/tutorial/flow/TutorialBigLogDialog";
import { TutorialInteractionGuard } from "@/components/tutorial/flow/TutorialInteractionGuard";
import { TutorialSpotlightOverlay } from "@/components/tutorial/flow/TutorialSpotlightOverlay";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";
import { resolveCombatTutorialSteps } from "@/services/tutorial/combat/resolve-combat-tutorial-steps";

interface IBoardTutorialFlowOverlayProps {
  combatLog: ICombatLogEvent[];
  selectedCard: boolean;
  isGraveyardOpen: boolean;
  isCombatLogOpen: boolean;
  hasWinner: boolean;
}

function hasEvent(events: ICombatLogEvent[], eventType: ICombatLogEvent["eventType"]): boolean {
  return events.some((event) => event.eventType === eventType);
}

function hasCardPlayedType(events: ICombatLogEvent[], cardType: string): boolean {
  return events.some((event) => event.eventType === "CARD_PLAYED" && event.payload.cardType === cardType);
}

export function BoardTutorialFlowOverlay(props: IBoardTutorialFlowOverlayProps) {
  const steps = useMemo(() => resolveCombatTutorialSteps(), []);
  const tutorial = useTutorialFlowController(steps);
  const hasPlayedEntity = hasCardPlayedType(props.combatLog, "ENTITY");
  const hasPlayedExecution = hasCardPlayedType(props.combatLog, "EXECUTION");
  const hasBattleResolved = hasEvent(props.combatLog, "BATTLE_RESOLVED") || hasEvent(props.combatLog, "DIRECT_DAMAGE");
  const hasFusionSummon = hasEvent(props.combatLog, "FUSION_SUMMONED");

  useEffect(() => {
    const currentStepId = tutorial.currentStep?.id;
    if (currentStepId === "combat-select-card" && props.selectedCard) tutorial.onAction("SELECT_CARD");
    if (currentStepId === "combat-attack-defense" && hasPlayedEntity) tutorial.onAction("PLAY_ENTITY");
    if (currentStepId === "combat-battle-resolution" && hasBattleResolved) tutorial.onAction("RESOLVE_BATTLE");
    if (currentStepId === "combat-execution" && hasPlayedExecution) tutorial.onAction("PLAY_EXECUTION");
    if (currentStepId === "combat-fusion" && hasFusionSummon) tutorial.onAction("FUSION_SUMMON");
    if (currentStepId === "combat-graveyard" && props.isGraveyardOpen) tutorial.onAction("OPEN_GRAVEYARD");
    if (currentStepId === "combat-log" && props.isCombatLogOpen) tutorial.onAction("OPEN_COMBAT_LOG");
    if (currentStepId === "combat-win-condition" && props.hasWinner) tutorial.onAction("MATCH_WON");
  }, [hasBattleResolved, hasFusionSummon, hasPlayedEntity, hasPlayedExecution, props.hasWinner, props.isCombatLogOpen, props.isGraveyardOpen, props.selectedCard, tutorial]);

  return (
    <>
      <TutorialInteractionGuard isEnabled={!tutorial.isFinished} allowedTargetIds={tutorial.allowedTargetIds} />
      <TutorialSpotlightOverlay isVisible={!tutorial.isFinished} targetId={tutorial.currentStep?.targetId ?? null} />
      <TutorialBigLogDialog
        title={tutorial.currentStep?.title ?? "Tutorial de combate completado"}
        description={tutorial.currentStep?.description ?? "Has cubierto las mecánicas base del duelo. Puedes repetir el nodo cuando quieras."}
        canUseNext={tutorial.canUseNext}
        isFinished={tutorial.isFinished}
        onNext={tutorial.onNext}
      />
    </>
  );
}
