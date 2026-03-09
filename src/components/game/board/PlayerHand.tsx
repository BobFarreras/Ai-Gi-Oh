// src/components/game/board/PlayerHand.tsx - Renderiza la mano del jugador con selección, acciones y estados obligatorios.
"use client";

import { useEffect, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { BattleMode } from "@/core/entities/IPlayer";
import { PlayerHandCardItem } from "@/components/game/board/internal/player-hand/PlayerHandCardItem";

interface PlayerHandProps {
  hand: ICard[]; 
  playingCard: ICard | null; 
  hasSummoned: boolean;
  isPlayerTurn: boolean;
  highlightedCardIds?: string[];
  cardScale?: number;
  overlapPx?: number;
  handYOffsetPx?: number;
  containerHeightPx?: number;
  hoverLiftPx?: number;
  centerOffsetPx?: number;
  dockRight?: boolean;
  bottomPx?: number;
  isMobileLayout?: boolean;
  showInlineActionPopover?: boolean;
  onMandatoryCardSelect?: (cardId: string) => void;
  onCardClick: (card: ICard, e: React.MouseEvent) => void;
  onPlayAction: (mode: BattleMode, e: React.MouseEvent) => void;
}

export function PlayerHand({
  hand,
  playingCard,
  hasSummoned,
  isPlayerTurn,
  highlightedCardIds = [],
  cardScale = 0.82,
  overlapPx = 22,
  handYOffsetPx = 118,
  containerHeightPx = 500,
  hoverLiftPx = 34,
  centerOffsetPx = 0,
  dockRight = false,
  bottomPx = 0,
  isMobileLayout = false,
  showInlineActionPopover = true,
  onMandatoryCardSelect,
  onCardClick,
  onPlayAction,
}: PlayerHandProps) {
  const [isLeftCardHovered, setIsLeftCardHovered] = useState(false);
  const [mobileViewportWidth, setMobileViewportWidth] = useState(390);
  useEffect(() => {
    if (!isMobileLayout) return;
    const sync = () => setMobileViewportWidth(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [isMobileLayout]);
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const effectiveCardScale = isMobileLayout ? clamp(cardScale, 0.3, 0.42) : cardScale;
  const mobileAvailableWidth = Math.max(130, mobileViewportWidth - 176);
  const estimatedCardWidth = 260 * effectiveCardScale;
  const mobileOverlapPx =
    hand.length <= 1
      ? 0
      : clamp(Math.round(((estimatedCardWidth * hand.length) - mobileAvailableWidth) / (hand.length - 1)), 30, Math.round(estimatedCardWidth - 18));
  const effectiveOverlapPx = isMobileLayout
    ? mobileOverlapPx
    : hand.length >= 5
      ? overlapPx + 24
      : hand.length === 4
        ? overlapPx + 10
        : overlapPx;
  const isSelectedCardVisible = Boolean(playingCard);
  const handLayerClass = isLeftCardHovered || isSelectedCardVisible ? "z-[180]" : "z-40";

  return (
    <div
      className={`absolute ${isMobileLayout ? "right-0" : "left-0 w-full"} flex items-end pointer-events-none perspective-[1200px] ${isMobileLayout ? "pb-0 pr-1" : "pb-4"} ${dockRight ? "justify-end" : "justify-center"} ${handLayerClass}`}
      style={{
        height: `${containerHeightPx}px`,
        transform: `translateX(${centerOffsetPx}px)`,
        bottom: `${bottomPx}px`,
        width: isMobileLayout ? `${mobileAvailableWidth}px` : undefined,
      }}
    >
      <div className="flex justify-center pointer-events-none relative">
        {hand.map((card, i) => {
          const isSelected = card.runtimeId && playingCard?.runtimeId ? playingCard.runtimeId === card.runtimeId : playingCard === card;
          const isMandatorySelectable = highlightedCardIds.includes(card.runtimeId ?? card.id);

          return (
            <PlayerHandCardItem
              key={`${card.id}-${i}`}
              card={card}
              index={i}
              handLength={hand.length}
              isSelected={isSelected}
              isPlayerTurn={isPlayerTurn}
              isMandatorySelectable={isMandatorySelectable}
              hasSummoned={hasSummoned}
              showInlineActionPopover={showInlineActionPopover}
              isMobileLayout={isMobileLayout}
              effectiveCardScale={effectiveCardScale}
              handYOffsetPx={handYOffsetPx}
              hoverLiftPx={hoverLiftPx}
              effectiveOverlapPx={effectiveOverlapPx}
              onMandatoryCardSelect={onMandatoryCardSelect}
              onCardClick={onCardClick}
              onPlayAction={onPlayAction}
              onHoverStartEdge={() => setIsLeftCardHovered(true)}
              onHoverEndEdge={() => setIsLeftCardHovered(false)}
            />
          );
        })}
      </div>
    </div>
  );
}
