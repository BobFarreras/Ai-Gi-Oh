// src/components/game/board/ui/layers/internal/board-interactive-equality.ts - Comparador memoizado para evitar re-renders innecesarios del layer interactivo.
import { IBoardInteractiveLayerProps } from "@/components/game/board/ui/layers/internal/board-interactive-types";
import { areIdListsEqual } from "@/components/game/board/internal/player-hand/hand-props-equality";

export function areEqualBoardInteractiveLayerProps(previous: IBoardInteractiveLayerProps, next: IBoardInteractiveLayerProps): boolean {
  const shouldSyncSidePanels = !next.isMobileLayout && (next.isHistoryOpen || Boolean(next.selectedCard));
  const sidePanelsStateStable = shouldSyncSidePanels ? previous.gameState === next.gameState : true;
  return (
    sidePanelsStateStable &&
    previous.player === next.player &&
    previous.opponent === next.opponent &&
    previous.phase === next.phase &&
    previous.isSummonBlocked === next.isSummonBlocked &&
    previous.selectedCard === next.selectedCard &&
    previous.selectedBoardEntityInstanceId === next.selectedBoardEntityInstanceId &&
    previous.playingCard === next.playingCard &&
    previous.activeAttackerId === next.activeAttackerId &&
    previous.revealedEntities === next.revealedEntities &&
    areIdListsEqual(previous.pendingEntitySelectionIds, next.pendingEntitySelectionIds) &&
    areIdListsEqual(previous.pendingOpponentSelectionIds, next.pendingOpponentSelectionIds) &&
    areIdListsEqual(previous.pendingFusionSelectedEntityIds, next.pendingFusionSelectedEntityIds) &&
    areIdListsEqual(previous.pendingDiscardCardIds, next.pendingDiscardCardIds) &&
    previous.isHistoryOpen === next.isHistoryOpen &&
    previous.isPlayerTurn === next.isPlayerTurn &&
    previous.canActivateSelectedExecution === next.canActivateSelectedExecution &&
    previous.pendingTrapActivationPrompt === next.pendingTrapActivationPrompt &&
    previous.canSetSelectedEntityToAttack === next.canSetSelectedEntityToAttack &&
    previous.lastDamageTargetPlayerId === next.lastDamageTargetPlayerId &&
    previous.lastDamageEventId === next.lastDamageEventId &&
    areIdListsEqual(previous.lastBuffTargetEntityIds, next.lastBuffTargetEntityIds) &&
    previous.lastBuffStat === next.lastBuffStat &&
    previous.lastBuffAmount === next.lastBuffAmount &&
    previous.lastBuffEventId === next.lastBuffEventId &&
    previous.lastCardXpCardId === next.lastCardXpCardId &&
    previous.lastCardXpAmount === next.lastCardXpAmount &&
    previous.lastCardXpEventId === next.lastCardXpEventId &&
    previous.lastCardXpActorPlayerId === next.lastCardXpActorPlayerId &&
    previous.onGraveyardClick === next.onGraveyardClick &&
    previous.onFusionDeckClick === next.onFusionDeckClick &&
    previous.onDestroyedClick === next.onDestroyedClick &&
    previous.onEntityClick === next.onEntityClick &&
    previous.onMandatoryCardSelect === next.onMandatoryCardSelect &&
    previous.onCardClick === next.onCardClick &&
    previous.onPlayAction === next.onPlayAction &&
    previous.onActivateSelectedExecution === next.onActivateSelectedExecution &&
    previous.onActivatePendingTrap === next.onActivatePendingTrap &&
    previous.onSkipPendingTrap === next.onSkipPendingTrap &&
    previous.onCyclePendingTrap === next.onCyclePendingTrap &&
    previous.onSetSelectedEntityToAttack === next.onSetSelectedEntityToAttack &&
    previous.onSelectCard === next.onSelectCard &&
    previous.onCloseCard === next.onCloseCard &&
    previous.onCloseHistory === next.onCloseHistory &&
    previous.isMobileLayout === next.isMobileLayout
  );
}
