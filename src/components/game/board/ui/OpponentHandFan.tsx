// src/components/game/board/ui/OpponentHandFan.tsx - Renderiza la mano del oponente en abanico con cartas cerradas.
"use client";

import { motion } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { CardBack } from "../../card/CardBack";

interface OpponentHandFanProps {
  hand: ICard[];
}

export function OpponentHandFan({ hand }: OpponentHandFanProps) {
  return (
    <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 flex justify-center items-start z-30 pointer-events-none opacity-90">
      {hand.map((_, index) => {
        const center = (hand.length - 1) / 2;
        const offset = index - center;

        return (
          <motion.div
            key={`op-hand-${index}`}
            initial={{ y: -100, scale: 0.4 }}
            animate={{ y: Math.abs(offset) * 8, rotate: offset * 5, scale: 0.4 }}
            className="origin-top relative -mx-5 shadow-2xl"
            style={{ zIndex: 10 - Math.abs(offset) }}
          >
            <CardBack className="shadow-[0_20px_50px_rgba(0,0,0,0.9)]" />
          </motion.div>
        );
      })}
    </div>
  );
}
