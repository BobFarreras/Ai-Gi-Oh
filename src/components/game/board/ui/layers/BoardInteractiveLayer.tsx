// src/components/game/board/ui/layers/BoardInteractiveLayer.tsx - Orquesta capas interactivas del tablero minimizando renders con memoización selectiva.
"use client";

import { memo } from "react";
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { Battlefield } from "../../Battlefield";
import { MobilePlayerHand } from "../../MobilePlayerHand";
import { PlayerHand } from "../../PlayerHand";
import { SidePanels } from "../../SidePanels";
import { useBoardViewportScale } from "../../hooks/internal/layout/use-board-viewport-scale";
import { BoardMobileSelectedCardOverlay } from "../overlays/BoardMobileSelectedCardOverlay";
import { countRender } from "@/services/performance/dev-performance-telemetry";

interface IBoardLayerPlayerState {
  id: string;
  hand: ICard[];
  deck: ICard[];
  fusionDeck?: ICard[];
  graveyard: ICard[];
  destroyedPile?: ICard[];
  activeEntities: IBoardEntity[];
  activeExecutions: IBoardEntity[];
}

interface BoardInteractiveLayerProps {
  gameState: GameState;
  player: IBoardLayerPlayerState;
  opponent: IBoardLayerPlayerState;
  phase: string;
  hasNormalSummonedThisTurn: boolean;
  selectedCard: ICard | null;
  selectedBoardEntityInstanceId: string | null;
  playingCard: ICard | null;
  activeAttackerId: string | null;
  revealedEntities: string[];
  pendingEntitySelectionIds: string[];
  pendingFusionSelectedEntityIds: string[];
  pendingDiscardCardIds: string[];
  isHistoryOpen: boolean;
  isPlayerTurn: boolean;
  canActivateSelectedExecution: boolean;
  canSetSelectedEntityToAttack?: boolean;
  lastDamageTargetPlayerId: string | null;
  lastDamageEventId: string | null;
  lastBuffTargetEntityIds: string[];
  lastBuffStat: string | null;
  lastBuffAmount: number | null;
  lastBuffEventId: string | null;
  lastCardXpCardId: string | null;
  lastCardXpAmount: number | null;
  lastCardXpEventId: string | null;
  lastCardXpActorPlayerId: string | null;
  onGraveyardClick: (side: "player" | "opponent") => void;
  onDestroyedClick?: (side: "player" | "opponent") => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: React.MouseEvent) => Promise<void>;
  onMandatoryCardSelect: (cardId: string) => void;
  onCardClick: (card: ICard, event?: React.MouseEvent) => void;
  onPlayAction: (mode: BattleMode, event: React.MouseEvent) => Promise<void>;
  onActivateSelectedExecution: () => void;
  onSetSelectedEntityToAttack?: () => void;
  onSelectCard: (card: ICard) => void;
  onCloseCard: () => void;
  onCloseHistory: () => void;
  isMobileLayout?: boolean;
}

function BoardInteractiveLayerComponent({
  gameState,
  player,
  opponent,
  phase,
  hasNormalSummonedThisTurn,
  selectedCard,
  selectedBoardEntityInstanceId,
  playingCard,
  activeAttackerId,
  revealedEntities,
  pendingEntitySelectionIds,
  pendingFusionSelectedEntityIds,
  pendingDiscardCardIds,
  isHistoryOpen,
  isPlayerTurn,
  canActivateSelectedExecution,
  canSetSelectedEntityToAttack = false,
  lastDamageTargetPlayerId,
  lastDamageEventId,
  lastBuffTargetEntityIds,
  lastBuffStat,
  lastBuffAmount,
  lastBuffEventId,
  lastCardXpCardId,
  lastCardXpAmount,
  lastCardXpEventId,
  lastCardXpActorPlayerId,
  onGraveyardClick,
  onDestroyedClick = () => undefined,
  onEntityClick,
  onMandatoryCardSelect,
  onCardClick,
  onPlayAction,
  onActivateSelectedExecution,
  onSetSelectedEntityToAttack = () => undefined,
  onSelectCard,
  onCloseCard,
  onCloseHistory,
  isMobileLayout = false,
}: BoardInteractiveLayerProps) {
  countRender("BoardInteractiveLayer");
  const isBattlePhase = phase.toUpperCase().includes("BATTLE");
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
          playerActiveEntities={player.activeEntities}
          playerActiveExecutions={player.activeExecutions}
          opponentActiveEntities={opponent.activeEntities}
          opponentActiveExecutions={opponent.activeExecutions}
          playerDeckCount={player.deck.length}
          playerFusionDeckCount={player.fusionDeck?.length ?? 0}
          opponentDeckCount={opponent.deck.length}
          opponentFusionDeckCount={opponent.fusionDeck?.length ?? 0}
          playerTopGraveCard={player.graveyard[player.graveyard.length - 1] ?? null}
          opponentTopGraveCard={opponent.graveyard[opponent.graveyard.length - 1] ?? null}
          playerGraveyardCount={player.graveyard.length}
          opponentGraveyardCount={opponent.graveyard.length}
          playerDestroyedCount={player.destroyedPile?.length ?? 0}
          opponentDestroyedCount={opponent.destroyedPile?.length ?? 0}
          activeAttackerId={activeAttackerId}
          selectedCard={selectedCard}
          selectedBoardEntityInstanceId={selectedBoardEntityInstanceId}
          revealedEntities={revealedEntities}
          highlightedPlayerEntityIds={pendingEntitySelectionIds}
          selectedFusionMaterialIds={pendingFusionSelectedEntityIds}
          damagedPlayerId={lastDamageTargetPlayerId}
          damageEventId={lastDamageEventId}
          buffedEntityIds={lastBuffTargetEntityIds}
          buffStat={lastBuffStat === "ATTACK" || lastBuffStat === "DEFENSE" ? lastBuffStat : null}
          buffAmount={lastBuffAmount}
          buffEventId={lastBuffEventId}
          cardXpCardId={lastCardXpCardId}
          cardXpAmount={lastCardXpAmount}
          cardXpEventId={lastCardXpEventId}
          cardXpActorPlayerId={lastCardXpActorPlayerId}
          playerId={player.id}
          opponentId={opponent.id}
          canActivateSelectedExecution={canActivateSelectedExecution}
          viewportBoardScale={viewport.boardScale}
          isMobileLayout={isMobileLayout}
          onActivateSelectedExecution={onActivateSelectedExecution}
          onGraveyardClick={onGraveyardClick}
          onDestroyedClick={onDestroyedClick}
          onEntityClick={onEntityClick}
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
          hasSummoned={hasNormalSummonedThisTurn}
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
          hasSummoned={hasNormalSummonedThisTurn}
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
          <SidePanels
            selectedCard={selectedCard}
            gameState={gameState}
            isHistoryOpen={isHistoryOpen}
            onSelectCard={onSelectCard}
            onCloseCard={onCloseCard}
            onCloseHistory={onCloseHistory}
          />
        </div>
      )}
    </>
  );
}

function areEqualBoardInteractiveLayerProps(previous: BoardInteractiveLayerProps, next: BoardInteractiveLayerProps): boolean {
  const shouldSyncSidePanels = !next.isMobileLayout && (next.isHistoryOpen || Boolean(next.selectedCard));
  const sidePanelsStateStable = shouldSyncSidePanels ? previous.gameState === next.gameState : true;
  return (
    sidePanelsStateStable &&
    previous.player === next.player &&
    previous.opponent === next.opponent &&
    previous.phase === next.phase &&
    previous.hasNormalSummonedThisTurn === next.hasNormalSummonedThisTurn &&
    previous.selectedCard === next.selectedCard &&
    previous.selectedBoardEntityInstanceId === next.selectedBoardEntityInstanceId &&
    previous.playingCard === next.playingCard &&
    previous.activeAttackerId === next.activeAttackerId &&
    previous.revealedEntities === next.revealedEntities &&
    previous.pendingEntitySelectionIds === next.pendingEntitySelectionIds &&
    previous.pendingFusionSelectedEntityIds === next.pendingFusionSelectedEntityIds &&
    previous.pendingDiscardCardIds === next.pendingDiscardCardIds &&
    previous.isHistoryOpen === next.isHistoryOpen &&
    previous.isPlayerTurn === next.isPlayerTurn &&
    previous.canActivateSelectedExecution === next.canActivateSelectedExecution &&
    previous.canSetSelectedEntityToAttack === next.canSetSelectedEntityToAttack &&
    previous.lastDamageTargetPlayerId === next.lastDamageTargetPlayerId &&
    previous.lastDamageEventId === next.lastDamageEventId &&
    previous.lastBuffTargetEntityIds === next.lastBuffTargetEntityIds &&
    previous.lastBuffStat === next.lastBuffStat &&
    previous.lastBuffAmount === next.lastBuffAmount &&
    previous.lastBuffEventId === next.lastBuffEventId &&
    previous.lastCardXpCardId === next.lastCardXpCardId &&
    previous.lastCardXpAmount === next.lastCardXpAmount &&
    previous.lastCardXpEventId === next.lastCardXpEventId &&
    previous.lastCardXpActorPlayerId === next.lastCardXpActorPlayerId &&
    previous.onGraveyardClick === next.onGraveyardClick &&
    previous.onDestroyedClick === next.onDestroyedClick &&
    previous.onEntityClick === next.onEntityClick &&
    previous.onMandatoryCardSelect === next.onMandatoryCardSelect &&
    previous.onCardClick === next.onCardClick &&
    previous.onPlayAction === next.onPlayAction &&
    previous.onActivateSelectedExecution === next.onActivateSelectedExecution &&
    previous.onSetSelectedEntityToAttack === next.onSetSelectedEntityToAttack &&
    previous.onSelectCard === next.onSelectCard &&
    previous.onCloseCard === next.onCloseCard &&
    previous.onCloseHistory === next.onCloseHistory &&
    previous.isMobileLayout === next.isMobileLayout
  );
}

export const BoardInteractiveLayer = memo(BoardInteractiveLayerComponent, areEqualBoardInteractiveLayerProps);
