// src/components/game/board/internal/player-hand/PlayerHandCardItem.tsx - Renderiza una carta de la mano con interacción, selección y popover.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { BattleMode } from "@/core/entities/IPlayer";
import { Card } from "@/components/game/card/Card";
import { PlayerHandActionPopover } from "@/components/game/board/internal/player-hand/PlayerHandActionPopover";

interface IPlayerHandCardItemProps {
  card: ICard;
  index: number;
  handLength: number;
  isSelected: boolean;
  isPlayerTurn: boolean;
  isMandatorySelectable: boolean;
  hasSummoned: boolean;
  showInlineActionPopover: boolean;
  isMobileLayout: boolean;
  effectiveCardScale: number;
  handYOffsetPx: number;
  hoverLiftPx: number;
  effectiveOverlapPx: number;
  onMandatoryCardSelect?: (cardId: string) => void;
  onCardClick: (card: ICard, e: React.MouseEvent) => void;
  onPlayAction: (mode: BattleMode, e: React.MouseEvent) => void;
  onHoverStartEdge: () => void;
  onHoverEndEdge: () => void;
}

export function PlayerHandCardItem({
  card,
  index,
  handLength,
  isSelected,
  isPlayerTurn,
  isMandatorySelectable,
  hasSummoned,
  showInlineActionPopover,
  isMobileLayout,
  effectiveCardScale,
  handYOffsetPx,
  hoverLiftPx,
  effectiveOverlapPx,
  onMandatoryCardSelect,
  onCardClick,
  onPlayAction,
  onHoverStartEdge,
  onHoverEndEdge,
}: IPlayerHandCardItemProps) {
  const isEntity = card.type === "ENTITY";
  const isFusion = card.type === "FUSION";
  const isTrap = card.type === "TRAP";
  const isBlocked = (isEntity || isFusion) && hasSummoned;

  return (
    <div className="relative">
      <AnimatePresence>{showInlineActionPopover && isSelected ? <PlayerHandActionPopover isBlocked={isBlocked} isEntityOrFusion={isEntity || isFusion} isFusion={isFusion} isTrap={isTrap} onPlayAction={onPlayAction} /> : null}</AnimatePresence>
      <motion.div
        data-tutorial-id={`tutorial-board-hand-card-${card.id}`}
        layoutId={`card-hand-${card.id}-${index}`}
        initial={{ y: 200, scale: 0.86 }}
        animate={{ y: isSelected ? (isMobileLayout ? handYOffsetPx - 8 : -40) : handYOffsetPx, rotate: isSelected ? 0 : isMobileLayout ? (index - handLength / 2) * 1.2 : (index - handLength / 2) * 2, scale: isSelected ? Math.min(1, effectiveCardScale + 0.1) : effectiveCardScale }}
        whileHover={isMobileLayout ? undefined : { y: isSelected ? -40 : -Math.min(hoverLiftPx, 12), scale: Math.min(1, effectiveCardScale + 0.1), zIndex: 9999 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onHoverStart={() => { if (!isMobileLayout && index === 0) onHoverStartEdge(); }}
        onHoverEnd={() => { if (!isMobileLayout && index === 0) onHoverEndEdge(); }}
        onClick={(e) => {
          if (!isPlayerTurn) return;
          if (isMandatorySelectable && onMandatoryCardSelect) { onMandatoryCardSelect(card.runtimeId ?? card.id); return; }
          onCardClick(card, e);
        }}
        className={isPlayerTurn ? "cursor-pointer origin-bottom pointer-events-auto" : "origin-bottom pointer-events-auto"}
        style={{ zIndex: isSelected ? 100 : index, marginLeft: index === 0 ? 0 : -effectiveOverlapPx }}
      >
        <motion.div
          animate={
            isMandatorySelectable
              ? {
                  scale: [1, 1.035, 1],
                  x: [0, -1.5, 1.5, 0],
                  y: [0, -1, 0],
                  boxShadow: [
                    "0 0 22px rgba(251,191,36,0.62)",
                    "0 0 34px rgba(251,191,36,0.92)",
                    "0 0 22px rgba(251,191,36,0.62)",
                  ],
                }
              : { scale: 1, x: 0, y: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" }
          }
          transition={isMandatorySelectable ? { duration: 1.05, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : { duration: 0.2 }}
          className={isMandatorySelectable ? "rounded-xl ring-4 ring-amber-400/95" : ""}
        >
          <Card card={card} isSelected={isSelected} />
        </motion.div>
      </motion.div>
    </div>
  );
}
