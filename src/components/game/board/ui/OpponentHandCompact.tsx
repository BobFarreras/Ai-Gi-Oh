// src/components/game/board/ui/OpponentHandCompact.tsx - Muestra la mano rival compacta en móvil como abanico lateral de reversos.
"use client";

import { ICard } from "@/core/entities/ICard";
import { CardBack } from "@/components/game/card/CardBack";

interface OpponentHandCompactProps {
  hand: ICard[];
}

export function OpponentHandCompact({ hand }: OpponentHandCompactProps) {
  const visibleCards = hand.slice(0, 5);
  return (
    <div className="pointer-events-none flex items-start">
      {visibleCards.map((_, index) => (
        <div key={`op-compact-${index}`} className="relative -mr-8 first:mr-0" style={{ zIndex: index + 1 }}>
          <div className="origin-top-left scale-[0.2]">
            <CardBack />
          </div>
        </div>
      ))}
    </div>
  );
}
