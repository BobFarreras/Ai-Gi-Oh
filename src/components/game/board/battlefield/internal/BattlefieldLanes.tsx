// src/components/game/board/battlefield/internal/BattlefieldLanes.tsx - Separa líneas de entidades/ejecuciones y delega render de slots del tablero.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { MouseEvent } from "react";
import { SlotGrid } from "../SlotGrid";

interface BattlefieldLanesProps {
  isOpponentSide: boolean;
  activeEntities: IBoardEntity[];
  activeExecutions: IBoardEntity[];
  activeAttackerId: string | null;
  selectedCard: ICard | null;
  selectedBoardEntityInstanceId: string | null;
  revealedEntities: string[];
  highlightedEntityIds: string[];
  selectedEntityIds: string[];
  buffedEntityIds: string[];
  buffStat: "ATTACK" | "DEFENSE" | null;
  buffAmount: number | null;
  buffEventId: string | null;
  cardXpCardId: string | null;
  cardXpAmount: number | null;
  cardXpEventId: string | null;
  canActivateSelectedExecution: boolean;
  isMobileLayout?: boolean;
  onActivateSelectedExecution: () => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: MouseEvent) => void;
}

export function BattlefieldLanes({
  isOpponentSide,
  activeEntities,
  activeExecutions,
  activeAttackerId,
  selectedCard,
  selectedBoardEntityInstanceId,
  revealedEntities,
  highlightedEntityIds,
  selectedEntityIds,
  buffedEntityIds,
  buffStat,
  buffAmount,
  buffEventId,
  cardXpCardId,
  cardXpAmount,
  cardXpEventId,
  canActivateSelectedExecution,
  isMobileLayout = false,
  onActivateSelectedExecution,
  onEntityClick,
}: BattlefieldLanesProps) {
  const upperLaneEntities = isOpponentSide ? activeExecutions : activeEntities;
  const lowerLaneEntities = isOpponentSide ? activeEntities : activeExecutions;
  return (
    <div className="flex flex-col gap-3" style={{ transformStyle: "preserve-3d" }}>
      <div className={cn("flex gap-3", isOpponentSide ? "opacity-60" : "")} style={{ transformStyle: "preserve-3d" }}>
        <SlotGrid
          laneType={isOpponentSide ? "EXECUTIONS" : "ENTITIES"}
          entities={upperLaneEntities}
          totalSlots={3}
          isOpponentSide={isOpponentSide}
          activeAttackerId={activeAttackerId}
          selectedCard={selectedCard}
          selectedBoardEntityInstanceId={selectedBoardEntityInstanceId}
          revealedEntities={revealedEntities}
          highlightedEntityIds={highlightedEntityIds}
          selectedEntityIds={selectedEntityIds}
          buffedEntityIds={buffedEntityIds}
          buffStat={buffStat}
          buffAmount={buffAmount}
          buffEventId={buffEventId}
          cardXpCardId={cardXpCardId}
          cardXpAmount={cardXpAmount}
          cardXpEventId={cardXpEventId}
          canActivateSelectedExecution={canActivateSelectedExecution}
          isMobileLayout={isMobileLayout}
          onActivateSelectedExecution={onActivateSelectedExecution}
          onEntityClick={onEntityClick}
        />
      </div>
      <div className={cn("flex gap-3", isOpponentSide ? "" : "opacity-60")} style={{ transformStyle: "preserve-3d" }}>
        <SlotGrid
          laneType={isOpponentSide ? "ENTITIES" : "EXECUTIONS"}
          entities={lowerLaneEntities}
          totalSlots={3}
          isOpponentSide={isOpponentSide}
          activeAttackerId={activeAttackerId}
          selectedCard={selectedCard}
          selectedBoardEntityInstanceId={selectedBoardEntityInstanceId}
          revealedEntities={revealedEntities}
          highlightedEntityIds={highlightedEntityIds}
          selectedEntityIds={selectedEntityIds}
          buffedEntityIds={buffedEntityIds}
          buffStat={buffStat}
          buffAmount={buffAmount}
          buffEventId={buffEventId}
          cardXpCardId={cardXpCardId}
          cardXpAmount={cardXpAmount}
          cardXpEventId={cardXpEventId}
          canActivateSelectedExecution={canActivateSelectedExecution}
          isMobileLayout={isMobileLayout}
          onActivateSelectedExecution={onActivateSelectedExecution}
          onEntityClick={onEntityClick}
        />
      </div>
    </div>
  );
}
