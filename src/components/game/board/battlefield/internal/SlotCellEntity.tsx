// src/components/game/board/battlefield/internal/SlotCellEntity.tsx - Render de entidad ocupando un slot con motion, carta y CTA de ejecución.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MouseEvent } from "react";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { Card } from "@/components/game/card/Card";
import { CardBack } from "@/components/game/card/CardBack";
import { resolveEntityMotionState } from "@/components/game/board/battlefield/internal/entity-motion";
import { resolveEntityVisibility } from "@/components/game/board/battlefield/internal/entity-visibility";
import { SummonHologramVfx } from "@/components/game/board/battlefield/internal/SummonHologramVfx";
import { ExecutionActivateButton } from "@/components/game/board/battlefield/internal/ExecutionActivateButton";

interface ISlotCellEntityProps {
  entity: IBoardEntity;
  index: number;
  isOpponentSide: boolean;
  isRevealed: boolean;
  isMobileLayout: boolean;
  isSelectedByCard: boolean;
  selectedCardId: string | null;
  selectedBoardEntityInstanceId: string | null;
  canActivateSelectedExecution: boolean;
  isAttacking: boolean;
  isActivating: boolean;
  isHighlighted: boolean;
  isSelectedMaterial: boolean;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: MouseEvent) => void;
  onActivateSelectedExecution: () => void;
}

export function SlotCellEntity({
  entity,
  index,
  isOpponentSide,
  isRevealed,
  isMobileLayout,
  isSelectedByCard,
  selectedCardId,
  selectedBoardEntityInstanceId,
  canActivateSelectedExecution,
  isAttacking,
  isActivating,
  isHighlighted,
  isSelectedMaterial,
  onEntityClick,
  onActivateSelectedExecution,
}: ISlotCellEntityProps) {
  const isExecutionSelectedForActivation =
    !isOpponentSide && entity.mode === "SET" && entity.card.type === "EXECUTION" && selectedBoardEntityInstanceId === entity.instanceId && canActivateSelectedExecution;
  const isBoardEntitySelected = selectedBoardEntityInstanceId === entity.instanceId || isSelectedByCard;
  const visibility = resolveEntityVisibility(entity, isRevealed);
  const motionState = resolveEntityMotionState({ isAttacking, isActivating, isOpponentSide, isHorizontal: visibility.isHorizontal });
  const targetX = -120 - index * 105;

  return (
    <motion.div
      key={entity.instanceId}
      style={{ transformStyle: "preserve-3d", transform: `rotateY(${motionState.initial.rotateY}deg) rotateZ(${motionState.initial.rotateZ}deg)` }}
      initial={motionState.initial}
      animate={motionState.animate}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      exit={{ opacity: [1, 0], scale: [0.28, 0.1], x: targetX, y: 0, transition: { duration: 0.4 } }}
      className={cn(
        "w-65 h-85 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center cursor-pointer",
        isAttacking ? "ring-4 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,1)] animate-pulse rounded-xl" : "",
        isBoardEntitySelected ? "ring-4 ring-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.9)] rounded-xl" : "",
        isHighlighted ? "ring-4 ring-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.8)] animate-pulse rounded-xl" : "",
        isSelectedMaterial ? "ring-4 ring-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.9)] rounded-xl" : "",
      )}
      data-board-card-id={entity.card.id}
      data-board-entity-instance-id={entity.instanceId}
      onClick={(event) => onEntityClick(entity, isOpponentSide, event)}
    >
      {visibility.isFaceDown ? (
        <div className="absolute w-full h-full flex items-center justify-center">
          <CardBack isHorizontal={visibility.isHorizontal} />
          {isSelectedMaterial ? <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-black rounded-md bg-cyan-300 text-cyan-950 shadow-[0_0_14px_rgba(34,211,238,0.9)]">MATERIAL</span> : null}
        </div>
      ) : (
        <div className="absolute w-full h-full flex items-center justify-center">
          <SummonHologramVfx show={Boolean(entity.isNewlySummoned && (entity.card.type === "ENTITY" || entity.card.type === "FUSION"))} />
          <Card card={entity.card} isSelected={selectedCardId === entity.card.id} hologramMode={isMobileLayout ? "lite" : "full"} boardMode={!visibility.isFaceDown && entity.mode === "SET" && entity.card.type === "ENTITY" ? "DEFENSE" : (entity.mode as BattleMode)} />
          {isActivating ? <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [1, 2.5] }} transition={{ duration: 0.5 }} className="absolute inset-0 bg-white rounded-xl mix-blend-overlay z-50" /> : null}
          {isSelectedMaterial ? <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-black rounded-md bg-cyan-300 text-cyan-950 shadow-[0_0_14px_rgba(34,211,238,0.9)]">MATERIAL</span> : null}
        </div>
      )}
      <AnimatePresence>{isExecutionSelectedForActivation ? <ExecutionActivateButton onActivateSelectedExecution={onActivateSelectedExecution} /> : null}</AnimatePresence>
    </motion.div>
  );
}
