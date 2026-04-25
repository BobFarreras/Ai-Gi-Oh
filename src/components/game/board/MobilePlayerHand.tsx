// src/components/game/board/MobilePlayerHand.tsx - Mano móvil dedicada con reparto adaptativo por ancho para mostrar siempre todas las cartas.
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/game/card/Card";
import { useBoardMobileHudLayout } from "@/components/game/board/internal/use-board-mobile-hud-layout";
import { ICard } from "@/core/entities/ICard";

interface MobilePlayerHandProps {
  hand: ICard[];
  playingCard: ICard | null;
  isPlayerTurn: boolean;
  highlightedCardIds?: string[];
  bottomOffsetPx?: number;
  onMandatoryCardSelect?: (cardId: string) => void;
  onCardClick: (card: ICard, event: React.MouseEvent) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function MobilePlayerHand({
  hand,
  playingCard,
  isPlayerTurn,
  highlightedCardIds = [],
  bottomOffsetPx = -8,
  onMandatoryCardSelect,
  onCardClick,
}: MobilePlayerHandProps) {
  const [viewportWidth, setViewportWidth] = useState(390);
  const [viewportHeight, setViewportHeight] = useState(844);
  const mobileHudLayout = useBoardMobileHudLayout();
  const handBandHeightPx = clamp(Math.round(viewportHeight * 0.24), 166, 214);

  useEffect(() => {
    const sync = () => {
      const width = window.visualViewport?.width ?? window.innerWidth;
      const height = window.visualViewport?.height ?? window.innerHeight;
      setViewportWidth(Math.round(width));
      setViewportHeight(Math.round(height));
    };
    sync();
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
    };
  }, []);

  const metrics = useMemo(() => {
    const availableWidth = Math.max(260, viewportWidth - 12);
    const count = Math.max(1, hand.length);
    const preferredScaleByCount =
      count >= 7 ? 0.246 : count === 6 ? 0.264 : count === 5 ? 0.284 : count === 4 ? 0.306 : 0.334;
    const sizePenalty = clamp((420 - viewportWidth) / 180, 0, 1) * 0.01;
    const maxScaleByBandHeight = handBandHeightPx / 380;
    const scale = clamp(Math.min(preferredScaleByCount - sizePenalty, maxScaleByBandHeight), 0.238, 0.42);
    const cardWidth = Math.round(260 * scale);
    const cardHeight = Math.round(380 * scale);
    const desiredSpread = Math.floor(availableWidth * 0.99);
    const rawSpacing = count <= 1 ? 0 : Math.floor((desiredSpread - cardWidth) / (count - 1));
    const spacing = count <= 1 ? 0 : clamp(rawSpacing, Math.floor(cardWidth * 0.5), Math.floor(cardWidth * 0.88));
    const containerWidth = count <= 1 ? cardWidth : Math.min(availableWidth, cardWidth + spacing * (count - 1));
    return { availableWidth, scale, cardWidth, cardHeight, spacing, containerWidth };
  }, [hand.length, handBandHeightPx, viewportWidth]);
  const playerHudTopPx = viewportHeight - (mobileHudLayout.playerHudBottomPx + mobileHudLayout.playerHudHeightPx);
  const handTopPx = Math.max(84, playerHudTopPx - handBandHeightPx - bottomOffsetPx - 10);

  return (
    <div
      data-tutorial-id="tutorial-board-hand"
      className="pointer-events-none absolute left-0 right-0 z-[170] flex items-end justify-center px-0"
      style={{ top: `${handTopPx}px`, height: `${handBandHeightPx}px` }}
    >
      <div className="relative h-full" style={{ width: `${metrics.availableWidth}px` }}>
        <div className="relative mx-auto h-full" style={{ width: `${metrics.containerWidth}px` }}>
          {hand.map((card, index) => {
            const isSelected = card.runtimeId && playingCard?.runtimeId ? playingCard.runtimeId === card.runtimeId : playingCard === card;
            const left = index * metrics.spacing;
            const mandatory = highlightedCardIds.includes(card.runtimeId ?? card.id);
            const cardScale = metrics.scale;
            return (
              <motion.button
                key={`${card.runtimeId ?? card.id}-${index}`}
                type="button"
                data-tutorial-id={`tutorial-board-hand-card-${card.id}`}
                aria-label={`Carta ${card.name}`}
                initial={false}
                animate={{ y: isSelected ? -6 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="pointer-events-auto absolute bottom-0 rounded-lg text-left"
                style={{ left: `${left}px`, width: `${metrics.cardWidth}px`, height: `${metrics.cardHeight}px`, zIndex: isSelected ? 999 : index + 10 }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!isPlayerTurn) return;
                  if (mandatory && onMandatoryCardSelect) {
                    onMandatoryCardSelect(card.runtimeId ?? card.id);
                    return;
                  }
                  onCardClick(card, event);
                }}
              >
                <motion.div
                  animate={
                    mandatory
                      ? {
                          scale: [cardScale, cardScale * 1.06, cardScale],
                          x: [0, -1.4, 1.4, 0],
                          y: [0, -1, 0],
                          boxShadow: [
                            "0 0 18px rgba(251,191,36,0.62)",
                            "0 0 30px rgba(251,191,36,0.9)",
                            "0 0 18px rgba(251,191,36,0.62)",
                          ],
                        }
                      : { scale: cardScale, x: 0, y: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" }
                  }
                  transition={mandatory ? { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : { duration: 0.2 }}
                  className={mandatory ? "rounded-xl ring-4 ring-amber-400/95" : ""}
                  style={{ width: "260px", height: "380px", transformOrigin: "top left" }}
                >
                  <Card
                    card={card}
                    isSelected={isSelected}
                    disableHoverEffects
                    disableDefaultShadow
                    isPerformanceMode
                  />
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
