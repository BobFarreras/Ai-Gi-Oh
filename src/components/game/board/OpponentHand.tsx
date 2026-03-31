// src/components/game/board/OpponentHand.tsx - Renderiza la mano rival como abanico de reversos con tamaño configurable para desktop/móvil.
"use client";

import { motion } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { CardBack } from "@/components/game/card/CardBack";

interface OpponentHandProps {
  hand: ICard[];
  className?: string;
  cardScale?: number;
}

export function OpponentHand({ hand, className = "", cardScale = 0.35 }: OpponentHandProps) {
  const spread = hand.length >= 5 ? 14 : 16;
  const arcDepth = hand.length >= 5 ? 3.1 : 3.5;

  return (
    <div data-board-hand-side="opponent" className={`pointer-events-none relative perspective-[1000px] ${className}`}>
      {hand.map((_, index) => {
        const center = (hand.length - 1) / 2;
        const offset = index - center;
        const rotation = offset * 14;
        const yPos = Math.abs(offset) * Math.abs(offset) * arcDepth;
        const xPos = offset * spread;
        return (
          <motion.div
            key={`op-hand-${index}`}
            initial={{ y: -100, scale: cardScale }}
            animate={{ y: yPos, x: xPos, rotate: rotation, scale: cardScale }}
            className="origin-top absolute left-1/2 -translate-x-1/2"
            style={{ zIndex: 10 - Math.abs(offset) }}
          >
            <CardBack className="shadow-[0_18px_40px_rgba(0,0,0,0.85)]" />
          </motion.div>
        );
      })}
    </div>
  );
}
