// src/components/game/board/battlefield/internal/SlotCell.tsx - Renderiza un slot del tablero con estado visual derivado y animaciones de entidad.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";
import { CardFloatingQueueVfx } from "../CardFloatingQueueVfx";
import { ExecutionActivationVfx } from "../ExecutionActivationVfx";
import { countRender } from "@/services/performance/dev-performance-telemetry";
import { SlotCellProps } from "./slot-cell-types";
import { buildFloatingEvents } from "./slot-cell-floating-events";
import { areEqualSlotCellProps } from "./slot-cell-props-equality";
import { SlotCellEntity } from "./SlotCellEntity";
import { useStickySlotEntity } from "./useStickySlotEntity";

function SlotCellComponent({
  laneType,
  index,
  entity,
  isOpponentSide,
  tutorialTargetId,
  activeAttackerId,
  selectedCardId,
  selectedBoardEntityInstanceId,
  isSelectedByCard,
  isRevealed,
  isHighlighted,
  isSelectedMaterial,
  isBuffed,
  buffStat,
  buffAmount,
  buffEventId,
  cardXpCardId,
  cardXpAmount,
  cardXpEventId,
  hasBlockingTrapActivation,
  isMobileLayout = false,
  onEntityClick,
}: SlotCellProps) {
  countRender("SlotCell");
  const isAttacking = entity?.instanceId === activeAttackerId;
  const { entity: renderedEntity, isSticky } = useStickySlotEntity(laneType, entity);
  const isActivating = renderedEntity?.mode === "ACTIVATE";
  const floatingEvents = buildFloatingEvents(renderedEntity, buffEventId, buffStat, buffAmount, isBuffed, cardXpEventId, cardXpCardId, cardXpAmount);

  return (
    <div
      data-slot-index={index}
      data-board-slot-side={isOpponentSide ? "opponent" : "player"}
      data-board-lane-type={laneType}
      data-tutorial-id={tutorialTargetId}
      style={{ transformStyle: "preserve-3d" }}
      className="relative w-24 h-36 border-2 border-cyan-500/30 rounded-lg bg-cyan-950/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)_inset] group hover:border-cyan-300 transition-colors duration-300"
    >
      {renderedEntity && <ExecutionActivationVfx entity={renderedEntity} isOpponentSide={isOpponentSide} />}
      {renderedEntity && floatingEvents.length > 0 && <CardFloatingQueueVfx entityId={renderedEntity.instanceId} events={floatingEvents} />}
      
      <AnimatePresence>
        {renderedEntity ? (
          <SlotCellEntity
            entity={renderedEntity}
            index={index}
            isOpponentSide={isOpponentSide}
            isRevealed={isRevealed}
            isMobileLayout={isMobileLayout}
            isSelectedByCard={isSelectedByCard}
            selectedCardId={selectedCardId}
            selectedBoardEntityInstanceId={selectedBoardEntityInstanceId}
            isAttacking={Boolean(renderedEntity.instanceId === activeAttackerId || isSticky)}
            isActivating={Boolean(isActivating)}
            shouldShowBlockedLock={Boolean(isAttacking && hasBlockingTrapActivation)}
            isHighlighted={isHighlighted}
            isSelectedMaterial={isSelectedMaterial}
            isInteractionLocked={isSticky}
            onEntityClick={onEntityClick}
          />
        ) : (
          <motion.span 
            key={`empty-${index}`} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.5 }} 
            exit={{ opacity: 0 }} 
            className="absolute text-cyan-500/30 text-[10px] font-black font-mono tracking-widest group-hover:opacity-100 cursor-pointer w-full h-full flex items-center justify-center" 
            onClick={(event) => onEntityClick(null, isOpponentSide, event)}
          >
            SLOT_{index + 1}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
export const SlotCell = memo(SlotCellComponent, areEqualSlotCellProps);
