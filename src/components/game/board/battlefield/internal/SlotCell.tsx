// src/components/game/board/battlefield/internal/SlotCell.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MouseEvent } from "react";
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { Card } from "@/components/game/card/Card";
import { CardBack } from "@/components/game/card/CardBack";
import { resolveEntityMotionState } from "./entity-motion";
import { resolveEntityVisibility } from "./entity-visibility";
import { SummonHologramVfx } from "./SummonHologramVfx";
import { ExecutionActivateButton } from "./ExecutionActivateButton";
import { CardFloatingQueueVfx } from "../CardFloatingQueueVfx";
import { ExecutionActivationVfx } from "../ExecutionActivationVfx";

interface SlotCellProps {
  index: number;
  entity: IBoardEntity | null;
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
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: MouseEvent) => void;
}

interface IStatFloatingEvent {
  id: string;
  type: "STAT";
  amount: number;
  stat: "ATTACK" | "DEFENSE";
}

interface IXpFloatingEvent {
  id: string;
  type: "XP";
  amount: number;
}

type FloatingEvent = IStatFloatingEvent | IXpFloatingEvent;

function buildFloatingEvents(
  entity: IBoardEntity | null,
  buffEventId: string | null,
  buffStat: "ATTACK" | "DEFENSE" | null,
  buffAmount: number | null,
  buffedEntityIds: string[],
  cardXpEventId: string | null,
  cardXpCardId: string | null,
  cardXpAmount: number | null,
) : FloatingEvent[] {
  if (!entity) return [];
  const events: FloatingEvent[] = [];
  if (buffEventId && buffStat && (buffAmount ?? 0) !== 0 && buffedEntityIds.includes(entity.instanceId)) {
    events.push({ id: `${buffEventId}-${entity.instanceId}`, type: "STAT" as const, amount: buffAmount ?? 0, stat: buffStat });
  }
  if (cardXpEventId && (cardXpAmount ?? 0) > 0 && cardXpCardId === entity.card.id) {
    events.push({ id: `${cardXpEventId}-${entity.instanceId}`, type: "XP" as const, amount: cardXpAmount ?? 0 });
  }
  return events;
}

export function SlotCell({
  index,
  entity,
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
}: SlotCellProps) {
  const isAttacking = entity?.instanceId === activeAttackerId;
  const isRevealed = entity ? revealedEntities.includes(entity.instanceId) : false;
  const isActivating = entity?.mode === "ACTIVATE";
  const isHighlighted = entity ? highlightedEntityIds.includes(entity.instanceId) : false;
  const isSelected = entity ? selectedEntityIds.includes(entity.instanceId) : false;
  
  const isExecutionSelectedForActivation =
    !isOpponentSide &&
    entity?.mode === "SET" &&
    entity.card.type === "EXECUTION" &&
    selectedBoardEntityInstanceId === entity.instanceId &&
    canActivateSelectedExecution;
    
  const floatingEvents = buildFloatingEvents(entity, buffEventId, buffStat, buffAmount, buffedEntityIds, cardXpEventId, cardXpCardId, cardXpAmount);
  const visibility = resolveEntityVisibility(entity ?? undefined, isRevealed);
  const motionState = resolveEntityMotionState({ isAttacking, isActivating, isOpponentSide, isHorizontal: visibility.isHorizontal });
  const targetX = -120 - index * 105;

  return (
    <div data-slot-index={index} style={{ transformStyle: "preserve-3d" }} className="relative w-24 h-36 border-2 border-cyan-500/30 rounded-lg bg-cyan-950/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)_inset] group hover:border-cyan-300 transition-colors duration-300">
      {entity && <ExecutionActivationVfx entity={entity} isOpponentSide={isOpponentSide} />}
      {entity && floatingEvents.length > 0 && <CardFloatingQueueVfx entityId={entity.instanceId} events={floatingEvents} />}
      
      <AnimatePresence>
        {entity ? (
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
              isHighlighted ? "ring-4 ring-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.8)] animate-pulse rounded-xl" : "", 
              isSelected ? "ring-4 ring-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.9)] rounded-xl" : ""
            )}
            data-board-card-id={entity.card.id}
            data-board-entity-instance-id={entity.instanceId}
            onClick={(event) => onEntityClick(entity, isOpponentSide, event)}
          >
            {/* CONTENIDO DE LA CARTA (FaceUp o FaceDown) */}
            {visibility.isFaceDown ? (
              <div className="absolute w-full h-full flex items-center justify-center">
                <CardBack isHorizontal={visibility.isHorizontal} />
                {isSelected && <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-black rounded-md bg-cyan-300 text-cyan-950 shadow-[0_0_14px_rgba(34,211,238,0.9)]">MATERIAL</span>}
              </div>
            ) : (
              <div className="absolute w-full h-full flex items-center justify-center">
                <SummonHologramVfx show={Boolean(entity.isNewlySummoned && (entity.card.type === "ENTITY" || entity.card.type === "FUSION"))} />
                <Card card={entity.card} isSelected={selectedCard?.id === entity.card.id} boardMode={!visibility.isFaceDown && entity.mode === "SET" && entity.card.type === "ENTITY" ? "DEFENSE" : (entity.mode as BattleMode)} />
                {isActivating && <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [1, 2.5] }} transition={{ duration: 0.5 }} className="absolute inset-0 bg-white rounded-xl mix-blend-overlay z-50" />}
                {isSelected && <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-black rounded-md bg-cyan-300 text-cyan-950 shadow-[0_0_14px_rgba(34,211,238,0.9)]">MATERIAL</span>}
              </div>
            )}

            {/* BOTÓN DE ACTIVACIÓN (Renderizado al final para que quede por encima de la carta) */}
            <AnimatePresence>
              {isExecutionSelectedForActivation && (
                <ExecutionActivateButton onActivateSelectedExecution={onActivateSelectedExecution} />
              )}
            </AnimatePresence>
            
          </motion.div>
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