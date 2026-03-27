// src/components/game/board/ui/layers/internal/BoardInteractiveLayerView.tsx - Renderiza las capas visuales/interactivas del tablero usando estado derivado precomputado.
"use client";

import { Battlefield } from "@/components/game/board/Battlefield";
import { MobilePlayerHand } from "@/components/game/board/MobilePlayerHand";
import { PlayerHand } from "@/components/game/board/PlayerHand";
import { SidePanels } from "@/components/game/board/SidePanels";
import { BoardMobileSelectedCardOverlay } from "@/components/game/board/ui/overlays/BoardMobileSelectedCardOverlay";
import { IBoardInteractiveLayerViewProps } from "@/components/game/board/ui/layers/internal/board-interactive-types";

export function BoardInteractiveLayerView(props: IBoardInteractiveLayerViewProps) {
  return (
    <>
      <div onClick={(event) => event.stopPropagation()}>
        <Battlefield
          playerActiveEntities={props.player.activeEntities}
          playerActiveExecutions={props.player.activeExecutions}
          opponentActiveEntities={props.opponent.activeEntities}
          opponentActiveExecutions={props.opponent.activeExecutions}
          playerDeckCount={props.player.deck.length}
          playerFusionDeckCount={props.player.fusionDeck?.length ?? 0}
          opponentDeckCount={props.opponent.deck.length}
          opponentFusionDeckCount={props.opponent.fusionDeck?.length ?? 0}
          playerTopGraveCard={props.player.graveyard[props.player.graveyard.length - 1] ?? null}
          opponentTopGraveCard={props.opponent.graveyard[props.opponent.graveyard.length - 1] ?? null}
          playerGraveyardCount={props.player.graveyard.length}
          opponentGraveyardCount={props.opponent.graveyard.length}
          playerDestroyedCount={props.player.destroyedPile?.length ?? 0}
          opponentDestroyedCount={props.opponent.destroyedPile?.length ?? 0}
          activeAttackerId={props.activeAttackerId}
          selectedCard={props.selectedCard}
          selectedBoardEntityInstanceId={props.selectedBoardEntityInstanceId}
          revealedEntities={props.revealedEntities}
          highlightedPlayerEntityIds={props.pendingEntitySelectionIds}
          selectedFusionMaterialIds={props.pendingFusionSelectedEntityIds}
          damagedPlayerId={props.lastDamageTargetPlayerId}
          damageEventId={props.lastDamageEventId}
          buffedEntityIds={props.lastBuffTargetEntityIds}
          buffStat={props.lastBuffStat === "ATTACK" || props.lastBuffStat === "DEFENSE" ? props.lastBuffStat : null}
          buffAmount={props.lastBuffAmount}
          buffEventId={props.lastBuffEventId}
          cardXpCardId={props.lastCardXpCardId}
          cardXpAmount={props.lastCardXpAmount}
          cardXpEventId={props.lastCardXpEventId}
          cardXpActorPlayerId={props.lastCardXpActorPlayerId}
          playerId={props.player.id}
          opponentId={props.opponent.id}
          canActivateSelectedExecution={props.canActivateSelectedExecution}
          viewportBoardScale={props.viewport.boardScale}
          isMobileLayout={props.isMobileLayout}
          onActivateSelectedExecution={props.onActivateSelectedExecution}
          onGraveyardClick={props.onGraveyardClick}
          onFusionDeckClick={props.onFusionDeckClick}
          onDestroyedClick={props.onDestroyedClick}
          onEntityClick={props.onEntityClick}
        />
      </div>
      {props.isMobileLayout ? (
        <MobilePlayerHand
          hand={props.player.hand}
          playingCard={props.playingCard}
          isPlayerTurn={props.isPlayerTurn}
          highlightedCardIds={props.pendingDiscardCardIds}
          onMandatoryCardSelect={props.onMandatoryCardSelect}
          onCardClick={props.onCardClick}
        />
      ) : (
        <PlayerHand
          hand={props.player.hand}
          playingCard={props.playingCard}
          hasSummoned={props.hasNormalSummonedThisTurn}
          isPlayerTurn={props.isPlayerTurn}
          highlightedCardIds={props.pendingDiscardCardIds}
          cardScale={props.viewport.handCardScale}
          overlapPx={props.viewport.handOverlapPx}
          handYOffsetPx={props.viewport.handYOffsetPx}
          containerHeightPx={props.viewport.handContainerHeightPx}
          hoverLiftPx={props.viewport.handHoverLiftPx}
          centerOffsetPx={props.viewport.handCenterOffsetPx}
          showInlineActionPopover
          onMandatoryCardSelect={props.onMandatoryCardSelect}
          onCardClick={props.onCardClick}
          onPlayAction={props.onPlayAction}
        />
      )}
      {props.isMobileLayout && props.selection.shouldRenderMobileOverlay && (
        <BoardMobileSelectedCardOverlay
          card={props.selection.selectedOverlayCard}
          hasSummoned={props.hasNormalSummonedThisTurn}
          isPlayerTurn={props.isPlayerTurn}
          source={props.selection.overlaySource}
          isOpponentCard={props.selection.isOpponentBoardSelection}
          canActivateExecutionFromBoard={props.selection.overlaySource === "BOARD" && props.canActivateSelectedExecution}
          canSetEntityToAttackFromBoard={props.selection.overlaySource === "BOARD" && Boolean(props.canSetSelectedEntityToAttack)}
          onClose={props.onCloseCard}
          onPlayAction={props.onPlayAction}
          onActivateExecutionFromBoard={props.onActivateSelectedExecution}
          onSetEntityToAttackFromBoard={props.onSetSelectedEntityToAttack ?? (() => undefined)}
        />
      )}
      {!props.isMobileLayout && (
        <div onClick={(event) => event.stopPropagation()}>
          <SidePanels
            selectedCard={props.selectedCard}
            gameState={props.gameState}
            isHistoryOpen={props.isHistoryOpen}
            onSelectCard={props.onSelectCard}
            onCloseCard={props.onCloseCard}
            onCloseHistory={props.onCloseHistory}
          />
        </div>
      )}
    </>
  );
}
