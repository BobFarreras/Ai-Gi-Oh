// src/components/game/board/battlefield/SlotGrid.tsx - Renderiza slots de tablero y aplica animaciones según modo y estado visual de entidad.
"use client";

import { useMemo } from "react";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { resolvePinnedSlotsForSide } from "./internal/slot-pin-cache";
import { SlotCell } from "./internal/SlotCell";

interface SlotGridProps {
  laneType: "ENTITIES" | "EXECUTIONS";
  entities: IBoardEntity[];
  totalSlots: number;
  isOpponentSide: boolean;
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
  onActivateSelectedExecution: () => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: React.MouseEvent) => void;
}

export function SlotGrid({
  laneType,
  entities,
  totalSlots,
  isOpponentSide,
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
  onActivateSelectedExecution,
  onEntityClick,
}: SlotGridProps) {
  const pinned = useMemo(() => {
    const side = isOpponentSide ? "opponent" : "player";
    const lane = laneType === "ENTITIES" ? "entities" : "executions";
    return resolvePinnedSlotsForSide(side, lane, entities, totalSlots);
  }, [entities, totalSlots, isOpponentSide, laneType]);

  return (
    <>
      {Array.from({ length: totalSlots }).map((_, index) => {
        return (
          <SlotCell
            key={index}
            index={index}
            entity={pinned.entitiesBySlot[index]}
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
            onActivateSelectedExecution={onActivateSelectedExecution}
            onEntityClick={onEntityClick}
          />
        );
      })}
    </>
  );
}
