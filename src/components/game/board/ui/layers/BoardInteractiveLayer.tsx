// src/components/game/board/ui/layers/BoardInteractiveLayer.tsx - Orquesta capas interactivas (tablero, mano y paneles) y enruta callbacks UI.
"use client";

import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { Battlefield } from "../../Battlefield";
import { PlayerHand } from "../../PlayerHand";
import { SidePanels } from "../../SidePanels";

interface BoardInteractiveLayerProps {
  gameState: GameState;
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
  onSelectCard: (card: ICard) => void;
  onCloseCard: () => void;
  onCloseHistory: () => void;
}

export function BoardInteractiveLayer({
  gameState,
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
  onSelectCard,
  onCloseCard,
  onCloseHistory,
}: BoardInteractiveLayerProps) {
  const player = gameState.playerA;
  const opponent = gameState.playerB;

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
          onActivateSelectedExecution={onActivateSelectedExecution}
          onGraveyardClick={onGraveyardClick}
          onDestroyedClick={onDestroyedClick}
          onEntityClick={onEntityClick}
        />
      </div>

      <PlayerHand
        hand={player.hand}
        playingCard={playingCard}
        hasSummoned={gameState.hasNormalSummonedThisTurn}
        isPlayerTurn={isPlayerTurn}
        highlightedCardIds={pendingDiscardCardIds}
        onMandatoryCardSelect={onMandatoryCardSelect}
        onCardClick={onCardClick}
        onPlayAction={onPlayAction}
      />

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
    </>
  );
}
