// src/components/game/board/MobilePlayerHand.tsx - Mano móvil dedicada con reparto adaptativo por ancho para mostrar siempre todas las cartas.
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/game/card/Card";
import { ICard } from "@/core/entities/ICard";

interface MobilePlayerHandProps {
  hand: ICard[];
  playingCard: ICard | null;
  isPlayerTurn: boolean;
  highlightedCardIds?: string[];
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
  onMandatoryCardSelect,
  onCardClick,
}: MobilePlayerHandProps) {
  const [viewportWidth, setViewportWidth] = useState(390);

  useEffect(() => {
    const sync = () => setViewportWidth(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const metrics = useMemo(() => {
    const availableWidth = Math.max(220, viewportWidth - 10);
    const count = Math.max(1, hand.length);
    const baseScale = count >= 5 ? 0.31 : count === 4 ? 0.34 : 0.37;
    const sizePenalty = clamp((420 - viewportWidth) / 170, 0, 1) * 0.04;
    const scale = clamp(baseScale - sizePenalty, 0.26, 0.39);
    const cardWidth = Math.round(260 * scale);
    const cardHeight = Math.round(380 * scale);
    const spacing = count <= 1 ? 0 : clamp(Math.floor((availableWidth - cardWidth) / (count - 1)), 13, cardWidth - 6);
    const containerWidth = count <= 1 ? cardWidth : cardWidth + spacing * (count - 1);
    return { availableWidth, scale, cardWidth, cardHeight, spacing, containerWidth };
  }, [hand.length, viewportWidth]);

  return (
    <div className="pointer-events-none absolute bottom-[90px] left-0 right-0 z-[170] flex h-[150px] items-end justify-center px-1">
      <div className="relative h-full" style={{ width: `${metrics.availableWidth}px` }}>
        <div className="relative mx-auto h-full" style={{ width: `${metrics.containerWidth}px` }}>
          {hand.map((card, index) => {
            const isSelected = card.runtimeId && playingCard?.runtimeId ? playingCard.runtimeId === card.runtimeId : playingCard === card;
            const left = index * metrics.spacing;
            const mandatory = highlightedCardIds.includes(card.runtimeId ?? card.id);
            return (
              <motion.button
                key={`${card.runtimeId ?? card.id}-${index}`}
                type="button"
                aria-label={`Carta ${card.name}`}
                initial={false}
                animate={{ y: isSelected ? -8 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="pointer-events-auto absolute bottom-0 rounded-lg text-left"
                style={{ left: `${left}px`, width: `${metrics.cardWidth}px`, height: `${metrics.cardHeight}px`, zIndex: isSelected ? 999 : index + 10 }}
                onClick={(event) => {
                  if (!isPlayerTurn) return;
                  if (mandatory && onMandatoryCardSelect) {
                    onMandatoryCardSelect(card.runtimeId ?? card.id);
                    return;
                  }
                  onCardClick(card, event);
                }}
              >
                <div
                  className={mandatory ? "rounded-xl ring-4 ring-amber-400/85 shadow-[0_0_18px_rgba(251,191,36,0.62)]" : ""}
                  style={{ width: "260px", height: "380px", transform: `scale(${metrics.scale})`, transformOrigin: "top left" }}
                >
                  <Card card={card} isSelected={isSelected} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
