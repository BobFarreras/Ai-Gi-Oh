// src/components/game/board/ui/layers/BoardInteractiveLayer.tsx - Orquesta capas interactivas (tablero, mano y paneles) y enruta callbacks UI.
"use client";

import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { Battlefield } from "../../Battlefield";
import { MobilePlayerHand } from "../../MobilePlayerHand";
import { PlayerHand } from "../../PlayerHand";
import { SidePanels } from "../../SidePanels";
import { useBoardViewportScale } from "../../hooks/internal/layout/use-board-viewport-scale";
import { BoardMobileSelectedCardOverlay } from "../overlays/BoardMobileSelectedCardOverlay";

interface BoardInteractiveLayerProps {
  gameState: GameState; selectedCard: ICard | null; selectedBoardEntityInstanceId: string | null; playingCard: ICard | null;
  activeAttackerId: string | null; revealedEntities: string[]; pendingEntitySelectionIds: string[]; pendingFusionSelectedEntityIds: string[];
  pendingDiscardCardIds: string[]; isHistoryOpen: boolean; isPlayerTurn: boolean; canActivateSelectedExecution: boolean;
  canSetSelectedEntityToAttack?: boolean;
  lastDamageTargetPlayerId: string | null; lastDamageEventId: string | null; lastBuffTargetEntityIds: string[]; lastBuffStat: string | null;
  lastBuffAmount: number | null; lastBuffEventId: string | null; lastCardXpCardId: string | null; lastCardXpAmount: number | null;
  lastCardXpEventId: string | null; lastCardXpActorPlayerId: string | null;
  onGraveyardClick: (side: "player" | "opponent") => void; onDestroyedClick?: (side: "player" | "opponent") => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: React.MouseEvent) => Promise<void>;
  onMandatoryCardSelect: (cardId: string) => void; onCardClick: (card: ICard, event?: React.MouseEvent) => void;
  onPlayAction: (mode: BattleMode, event: React.MouseEvent) => Promise<void>; onActivateSelectedExecution: () => void;
  onSetSelectedEntityToAttack?: () => void;
  onSelectCard: (card: ICard) => void; onCloseCard: () => void; onCloseHistory: () => void;
  isMobileLayout?: boolean;
}

export function BoardInteractiveLayer({
  gameState, selectedCard, selectedBoardEntityInstanceId, playingCard, activeAttackerId, revealedEntities, pendingEntitySelectionIds,
  pendingFusionSelectedEntityIds, pendingDiscardCardIds, isHistoryOpen, isPlayerTurn, canActivateSelectedExecution, lastDamageTargetPlayerId,
  canSetSelectedEntityToAttack = false,
  lastDamageEventId, lastBuffTargetEntityIds, lastBuffStat, lastBuffAmount, lastBuffEventId, lastCardXpCardId, lastCardXpAmount, lastCardXpEventId,
  lastCardXpActorPlayerId, onGraveyardClick, onDestroyedClick = () => undefined, onEntityClick, onMandatoryCardSelect, onCardClick, onPlayAction,
  onActivateSelectedExecution, onSetSelectedEntityToAttack = () => undefined, onSelectCard, onCloseCard, onCloseHistory, isMobileLayout = false,
}: BoardInteractiveLayerProps) {
  const player = gameState.playerA;
  const opponent = gameState.playerB;
  const isBattlePhase = gameState.phase.toUpperCase().includes("BATTLE");
  const viewport = useBoardViewportScale({ hasLeftPanel: !isMobileLayout && Boolean(selectedCard), hasRightPanel: !isMobileLayout && isHistoryOpen });
  const selectedPlayerBoardEntityById = selectedBoardEntityInstanceId
    ? [...player.activeEntities, ...player.activeExecutions].find((entity) => entity.instanceId === selectedBoardEntityInstanceId) ?? null
    : null;
  const selectedOpponentBoardEntityById = selectedBoardEntityInstanceId
    ? [...opponent.activeEntities, ...opponent.activeExecutions].find((entity) => entity.instanceId === selectedBoardEntityInstanceId) ?? null
    : null;
  const selectedPlayerBoardEntityByCard = selectedCard
    ? [...player.activeEntities, ...player.activeExecutions].find((entity) => {
        if (selectedCard.runtimeId && entity.card.runtimeId) return selectedCard.runtimeId === entity.card.runtimeId;
        return selectedCard.id === entity.card.id;
      }) ?? null
    : null;
  const selectedOpponentBoardEntityByCard = selectedCard
    ? [...opponent.activeEntities, ...opponent.activeExecutions].find((entity) => {
        if (selectedCard.runtimeId && entity.card.runtimeId) return selectedCard.runtimeId === entity.card.runtimeId;
        return selectedCard.id === entity.card.id;
      }) ?? null
    : null;
  const selectedPlayerBoardEntity = selectedPlayerBoardEntityById ?? selectedPlayerBoardEntityByCard;
  const selectedOpponentBoardEntity = selectedOpponentBoardEntityById ?? selectedOpponentBoardEntityByCard;
  const hasBoardSelection = !playingCard && Boolean(selectedBoardEntityInstanceId || selectedPlayerBoardEntityByCard || selectedOpponentBoardEntityByCard);
  const overlaySource = hasBoardSelection ? "BOARD" : "HAND";
  const isOpponentBoardSelection = Boolean(selectedOpponentBoardEntity);
  const selectedBoardEntity = selectedPlayerBoardEntity ?? selectedOpponentBoardEntity;
  const selectedOverlayCard = overlaySource === "BOARD" ? (selectedBoardEntity?.card ?? null) : (playingCard ?? null);
  const shouldHideOverlayForOwnBoardInBattle = overlaySource === "BOARD" && !isOpponentBoardSelection && isBattlePhase;
  const shouldHideOpponentSetInSummonPhase =
    overlaySource === "BOARD" &&
    !isBattlePhase &&
    Boolean(selectedOpponentBoardEntity?.mode === "SET");
  const shouldRenderMobileOverlay =
    Boolean(selectedOverlayCard) &&
    !shouldHideOverlayForOwnBoardInBattle &&
    !shouldHideOpponentSetInSummonPhase;

  return (
    <>
      <div onClick={(event) => event.stopPropagation()}>
        <Battlefield
          playerActiveEntities={player.activeEntities} playerActiveExecutions={player.activeExecutions}
          opponentActiveEntities={opponent.activeEntities} opponentActiveExecutions={opponent.activeExecutions}
          playerDeckCount={player.deck.length} playerFusionDeckCount={player.fusionDeck?.length ?? 0}
          opponentDeckCount={opponent.deck.length} opponentFusionDeckCount={opponent.fusionDeck?.length ?? 0}
          playerTopGraveCard={player.graveyard[player.graveyard.length - 1] ?? null} opponentTopGraveCard={opponent.graveyard[opponent.graveyard.length - 1] ?? null}
          playerGraveyardCount={player.graveyard.length} opponentGraveyardCount={opponent.graveyard.length}
          playerDestroyedCount={player.destroyedPile?.length ?? 0} opponentDestroyedCount={opponent.destroyedPile?.length ?? 0}
          activeAttackerId={activeAttackerId} selectedCard={selectedCard} selectedBoardEntityInstanceId={selectedBoardEntityInstanceId}
          revealedEntities={revealedEntities} highlightedPlayerEntityIds={pendingEntitySelectionIds} selectedFusionMaterialIds={pendingFusionSelectedEntityIds}
          damagedPlayerId={lastDamageTargetPlayerId} damageEventId={lastDamageEventId} buffedEntityIds={lastBuffTargetEntityIds}
          buffStat={lastBuffStat === "ATTACK" || lastBuffStat === "DEFENSE" ? lastBuffStat : null}
          buffAmount={lastBuffAmount} buffEventId={lastBuffEventId} cardXpCardId={lastCardXpCardId}
          cardXpAmount={lastCardXpAmount} cardXpEventId={lastCardXpEventId} cardXpActorPlayerId={lastCardXpActorPlayerId}
          playerId={player.id} opponentId={opponent.id} canActivateSelectedExecution={canActivateSelectedExecution}
          viewportBoardScale={viewport.boardScale}
          isMobileLayout={isMobileLayout}
          onActivateSelectedExecution={onActivateSelectedExecution} onGraveyardClick={onGraveyardClick}
          onDestroyedClick={onDestroyedClick} onEntityClick={onEntityClick}
        />
      </div>
      {isMobileLayout ? (
        <MobilePlayerHand
          hand={player.hand}
          playingCard={playingCard}
          isPlayerTurn={isPlayerTurn}
          highlightedCardIds={pendingDiscardCardIds}
          onMandatoryCardSelect={onMandatoryCardSelect}
          onCardClick={onCardClick}
        />
      ) : (
        <PlayerHand
          hand={player.hand}
          playingCard={playingCard}
          hasSummoned={gameState.hasNormalSummonedThisTurn}
          isPlayerTurn={isPlayerTurn}
          highlightedCardIds={pendingDiscardCardIds}
          cardScale={viewport.handCardScale}
          overlapPx={viewport.handOverlapPx}
          handYOffsetPx={viewport.handYOffsetPx}
          containerHeightPx={viewport.handContainerHeightPx}
          hoverLiftPx={viewport.handHoverLiftPx}
          centerOffsetPx={viewport.handCenterOffsetPx}
          showInlineActionPopover
          onMandatoryCardSelect={onMandatoryCardSelect}
          onCardClick={onCardClick}
          onPlayAction={onPlayAction}
        />
      )}
      {isMobileLayout && shouldRenderMobileOverlay && (
        <BoardMobileSelectedCardOverlay
          card={selectedOverlayCard}
          hasSummoned={gameState.hasNormalSummonedThisTurn}
          isPlayerTurn={isPlayerTurn}
          source={overlaySource}
          isOpponentCard={isOpponentBoardSelection}
          canActivateExecutionFromBoard={overlaySource === "BOARD" && canActivateSelectedExecution}
          canSetEntityToAttackFromBoard={overlaySource === "BOARD" && canSetSelectedEntityToAttack}
          onClose={onCloseCard}
          onPlayAction={onPlayAction}
          onActivateExecutionFromBoard={onActivateSelectedExecution}
          onSetEntityToAttackFromBoard={onSetSelectedEntityToAttack}
        />
      )}
      {!isMobileLayout && (
        <div onClick={(event) => event.stopPropagation()}>
          <SidePanels selectedCard={selectedCard} gameState={gameState} isHistoryOpen={isHistoryOpen} onSelectCard={onSelectCard} onCloseCard={onCloseCard} onCloseHistory={onCloseHistory} />
        </div>
      )}
    </>
  );
}
