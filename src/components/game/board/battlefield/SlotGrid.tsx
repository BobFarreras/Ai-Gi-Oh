import { AnimatePresence, motion } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { Card } from "../../card/Card";
import { CardBack } from "../../card/CardBack";
import { BuffImpactVfx } from "./BuffImpactVfx";
import { ExecutionActivationVfx } from "./ExecutionActivationVfx";

interface SlotGridProps {
  entities: IBoardEntity[];
  totalSlots: number;
  isOpponentSide: boolean;
  activeAttackerId: string | null;
  selectedCard: ICard | null;
  revealedEntities: string[];
  highlightedEntityIds: string[];
  buffedEntityIds: string[];
  buffStat: "ATTACK" | "DEFENSE" | null;
  buffAmount: number | null;
  buffEventId: string | null;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: React.MouseEvent) => void;
}

export function SlotGrid({
  entities,
  totalSlots,
  isOpponentSide,
  activeAttackerId,
  selectedCard,
  revealedEntities,
  highlightedEntityIds,
  buffedEntityIds,
  buffStat,
  buffAmount,
  buffEventId,
  onEntityClick,
}: SlotGridProps) {
  return (
    <>
      {Array.from({ length: totalSlots }).map((_, index) => {
        const entity = entities[index];
        const isAttacking = entity?.instanceId === activeAttackerId;
        const isRevealed = entity ? revealedEntities.includes(entity.instanceId) : false;
        const isActivating = entity?.mode === "ACTIVATE";
        const isHighlighted = entity ? highlightedEntityIds.includes(entity.instanceId) : false;
        const isBuffed = entity ? Boolean(buffEventId) && buffedEntityIds.includes(entity.instanceId) : false;
        const isFaceDown = (entity?.mode === "DEFENSE" || entity?.mode === "SET") && !isRevealed;
        const isHorizontal = entity?.mode === "DEFENSE" || (entity?.mode === "SET" && entity.card.type === "ENTITY");
        const targetX = -120 - index * 105;

        return (
          <div
            key={index}
            style={{ transformStyle: "preserve-3d" }}
            className="relative w-24 h-36 border-2 border-cyan-500/30 rounded-lg bg-cyan-950/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)_inset] group hover:border-cyan-300 transition-colors duration-300"
          >
            {entity && <ExecutionActivationVfx entity={entity} isOpponentSide={isOpponentSide} />}

            <AnimatePresence>
              {entity ? (
                <motion.div
                  key={entity.instanceId}
                  style={{ transformStyle: "preserve-3d" }}
                  initial={{ opacity: 0, scale: 0.2, y: -50 }}
                  animate={{
                    opacity: 1,
                    scale: isAttacking ? 0.38 : isActivating ? 0.35 : 0.28,
                    y: isAttacking ? (isOpponentSide ? 30 : -30) : isActivating ? -20 : 0,
                    zIndex: isAttacking || isActivating ? 50 : 10,
                    rotateY: isFaceDown ? 180 : 0,
                    rotateZ: isHorizontal ? -90 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  exit={{ opacity: [1, 0], scale: [0.28, 0.1], x: targetX, y: 0, transition: { duration: 0.4 } }}
                  className={cn(
                    "w-[260px] h-[340px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center cursor-pointer",
                    isAttacking ? "ring-4 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,1)] animate-pulse rounded-xl" : "",
                    isHighlighted ? "ring-4 ring-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.8)] animate-pulse rounded-xl" : "",
                  )}
                  onClick={(event) => onEntityClick(entity, isOpponentSide, event)}
                >
                  {isBuffed && buffStat && buffEventId && (buffAmount ?? 0) > 0 && (
                    <BuffImpactVfx eventId={buffEventId} entityId={entity.instanceId} stat={buffStat} amount={buffAmount ?? 0} />
                  )}
                  <div className="absolute w-full h-full flex items-center justify-center" style={{ backfaceVisibility: "hidden" }}>
                    <Card card={entity.card} isSelected={selectedCard?.id === entity.card.id} boardMode={entity.mode} />
                    {isActivating && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [1, 2.5] }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-white rounded-xl mix-blend-overlay z-50"
                      />
                    )}
                  </div>
                  <div
                    className="absolute w-full h-full flex items-center justify-center"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <CardBack />
                  </div>
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
      })}
    </>
  );
}
