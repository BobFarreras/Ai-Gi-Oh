// src/components/game/card/Card.tsx - Render de carta base con frame y holograma condicional según estado en tablero.
"use client";

import { ICard } from "@/core/entities/ICard";
import { BattleMode } from "@/core/entities/IPlayer";
import { getCardTypeStyles } from "./internal/styles";
import { CardFrame } from "./internal/CardFrame";
import { CardHologram } from "./internal/CardHologram";

interface CardProps {
  card: ICard;
  onClick?: (card: ICard) => void;
  isSelected?: boolean;
  boardMode?: BattleMode;
  versionTier?: number;
  level?: number;
  xp?: number;
  masteryPassiveLabel?: string | null;
}

function isBoardMode(mode?: BattleMode): boolean {
  return mode === "ATTACK" || mode === "DEFENSE" || mode === "SET" || mode === "ACTIVATE";
}

export function Card({
  card,
  onClick,
  isSelected = false,
  boardMode,
  versionTier = 0,
  level = 0,
  xp = 0,
  masteryPassiveLabel = null,
}: CardProps) {
  const isOnBoard = isBoardMode(boardMode);
  const isDefense = boardMode === "DEFENSE";
  const shouldRenderHologram = isOnBoard && boardMode !== "SET";

  return (
    <div className="group/card relative h-[380px] w-[260px]" style={{ transformStyle: "preserve-3d" }}>
      <CardFrame
        card={card}
        factionStyles={getCardTypeStyles(card)}
        isSelected={isSelected}
        isOnBoard={isOnBoard}
        onClick={onClick}
        versionTier={versionTier}
        level={level}
        xp={xp}
        masteryPassiveLabel={masteryPassiveLabel}
      />
      {shouldRenderHologram && <CardHologram card={card} isDefense={isDefense} />}
    </div>
  );
}
