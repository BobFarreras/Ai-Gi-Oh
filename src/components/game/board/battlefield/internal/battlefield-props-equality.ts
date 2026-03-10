// src/components/game/board/battlefield/internal/battlefield-props-equality.ts - Comparator memoizado para evitar renders innecesarios de Battlefield.
import { BattlefieldProps } from "@/components/game/board/battlefield/internal/battlefield-types";

export function areEqualBattlefieldProps(previous: BattlefieldProps, next: BattlefieldProps): boolean {
  return (
    previous.playerActiveEntities === next.playerActiveEntities &&
    previous.playerActiveExecutions === next.playerActiveExecutions &&
    previous.opponentActiveEntities === next.opponentActiveEntities &&
    previous.opponentActiveExecutions === next.opponentActiveExecutions &&
    previous.playerDeckCount === next.playerDeckCount &&
    previous.playerFusionDeckCount === next.playerFusionDeckCount &&
    previous.opponentDeckCount === next.opponentDeckCount &&
    previous.opponentFusionDeckCount === next.opponentFusionDeckCount &&
    previous.playerTopGraveCard === next.playerTopGraveCard &&
    previous.opponentTopGraveCard === next.opponentTopGraveCard &&
    previous.playerGraveyardCount === next.playerGraveyardCount &&
    previous.opponentGraveyardCount === next.opponentGraveyardCount &&
    previous.playerDestroyedCount === next.playerDestroyedCount &&
    previous.opponentDestroyedCount === next.opponentDestroyedCount &&
    previous.activeAttackerId === next.activeAttackerId &&
    previous.selectedCard === next.selectedCard &&
    previous.selectedBoardEntityInstanceId === next.selectedBoardEntityInstanceId &&
    previous.revealedEntities === next.revealedEntities &&
    previous.highlightedPlayerEntityIds === next.highlightedPlayerEntityIds &&
    previous.selectedFusionMaterialIds === next.selectedFusionMaterialIds &&
    previous.damagedPlayerId === next.damagedPlayerId &&
    previous.damageEventId === next.damageEventId &&
    previous.buffedEntityIds === next.buffedEntityIds &&
    previous.buffStat === next.buffStat &&
    previous.buffAmount === next.buffAmount &&
    previous.buffEventId === next.buffEventId &&
    previous.cardXpCardId === next.cardXpCardId &&
    previous.cardXpAmount === next.cardXpAmount &&
    previous.cardXpEventId === next.cardXpEventId &&
    previous.cardXpActorPlayerId === next.cardXpActorPlayerId &&
    previous.playerId === next.playerId &&
    previous.opponentId === next.opponentId &&
    previous.canActivateSelectedExecution === next.canActivateSelectedExecution &&
    previous.viewportBoardScale === next.viewportBoardScale &&
    previous.isMobileLayout === next.isMobileLayout &&
    previous.onActivateSelectedExecution === next.onActivateSelectedExecution &&
    previous.onGraveyardClick === next.onGraveyardClick &&
    previous.onDestroyedClick === next.onDestroyedClick &&
    previous.onEntityClick === next.onEntityClick
  );
}
