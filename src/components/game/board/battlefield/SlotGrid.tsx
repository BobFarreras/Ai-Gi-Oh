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
  isMobileLayout?: boolean;
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
  isMobileLayout = false,
  onActivateSelectedExecution,
  onEntityClick,
}: SlotGridProps) {
  const pinned = useMemo(() => {
    const side = isOpponentSide ? "opponent" : "player";
    const lane = laneType === "ENTITIES" ? "entities" : "executions";
    return resolvePinnedSlotsForSide(side, lane, entities, totalSlots);
  }, [entities, totalSlots, isOpponentSide, laneType]);
  const revealedSet = useMemo(() => new Set(revealedEntities), [revealedEntities]);
  const highlightedSet = useMemo(() => new Set(highlightedEntityIds), [highlightedEntityIds]);
  const selectedSet = useMemo(() => new Set(selectedEntityIds), [selectedEntityIds]);
  const buffedSet = useMemo(() => new Set(buffedEntityIds), [buffedEntityIds]);
  const selectedCardId = selectedCard?.id ?? null;
  const selectedCardKey = selectedCard ? (selectedCard.runtimeId ?? selectedCard.id) : null;

  return (
    <>
      {Array.from({ length: totalSlots }).map((_, index) => {
        const entity = pinned.entitiesBySlot[index];
        const entityCardKey = entity ? (entity.card.runtimeId ?? entity.card.id) : null;
        return (
          <SlotCell
            key={index}
            index={index}
            entity={entity}
            isOpponentSide={isOpponentSide}
            activeAttackerId={activeAttackerId}
            selectedCardId={selectedCardId}
            selectedBoardEntityInstanceId={selectedBoardEntityInstanceId}
            isSelectedByCard={Boolean(entity && selectedCardKey && selectedCardKey === entityCardKey)}
            isRevealed={Boolean(entity && revealedSet.has(entity.instanceId))}
            isHighlighted={Boolean(entity && highlightedSet.has(entity.instanceId))}
            isSelectedMaterial={Boolean(entity && selectedSet.has(entity.instanceId))}
            isBuffed={Boolean(entity && buffedSet.has(entity.instanceId))}
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
        );
      })}
    </>
  );
}
