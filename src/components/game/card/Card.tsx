"use client";

import { ICard } from "@/core/entities/ICard";
import { BattleMode } from "@/core/entities/IPlayer";
import { FACTION_STYLES } from "./internal/styles";
import { CardFrame } from "./internal/CardFrame";
import { CardHologram } from "./internal/CardHologram";

interface CardProps {
  card: ICard;
  onClick?: (card: ICard) => void;
  isSelected?: boolean;
  boardMode?: BattleMode;
}

function isBoardMode(mode?: BattleMode): boolean {
  return mode === "ATTACK" || mode === "DEFENSE" || mode === "SET" || mode === "ACTIVATE";
}

export function Card({ card, onClick, isSelected = false, boardMode }: CardProps) {
  const isOnBoard = isBoardMode(boardMode);
  const isDefense = boardMode === "DEFENSE" || boardMode === "SET";

  return (
    <div className="relative w-[260px] h-[340px] group/card" style={{ transformStyle: "preserve-3d" }}>
      <CardFrame
        card={card}
        factionStyles={FACTION_STYLES[card.faction] ?? FACTION_STYLES.NEUTRAL}
        isSelected={isSelected}
        isOnBoard={isOnBoard}
        onClick={onClick}
      />
      {isOnBoard && <CardHologram card={card} isDefense={isDefense} />}
    </div>
  );
}
