// src/components/game/card/Card.tsx - Render de carta base con frame y holograma condicional según estado en tablero.
"use client";

import { memo } from "react";
import { ICard } from "@/core/entities/ICard";
import { BattleMode } from "@/core/entities/IPlayer";
import { resolveMasteryPassiveLabel } from "@/core/services/progression/mastery-passive-display";
import { CARD_CLIP_PATHS, getCardTypeStyles } from "./internal/styles";
import { CardFrame } from "./internal/CardFrame";
import { CardHologram } from "./internal/CardHologram";
import { ICardUpgradeCounts } from "./internal/card-frame-types";

interface CardProps {
  card: ICard;
  onClick?: (card: ICard) => void;
  isSelected?: boolean;
  boardMode?: BattleMode;
  disableHoverEffects?: boolean;
  clipToFrameShape?: boolean;
  disableDefaultShadow?: boolean;
  disableHologram?: boolean;
  hologramMode?: "full" | "lite";
  isPerformanceMode?: boolean;
  showBackgroundInPerformanceMode?: boolean;
  versionTier?: number;
  level?: number;
  xp?: number;
  masteryPassiveLabel?: string | null;
  prioritizeMediaLoading?: boolean;
  /** Badges ×N de objetos aplicados (ATK/DEF). Solo el arsenal los pasa; el tablero no. */
  upgradeCounts?: ICardUpgradeCounts | null;
}

function isBoardMode(mode?: BattleMode): boolean {
  return mode === "ATTACK" || mode === "DEFENSE" || mode === "SET" || mode === "ACTIVATE";
}

function CardComponent({
  card,
  onClick,
  isSelected = false,
  boardMode,
  disableHoverEffects = false,
  clipToFrameShape = false,
  disableDefaultShadow = false,
  disableHologram = false,
  hologramMode = "full",
  isPerformanceMode = false,
  showBackgroundInPerformanceMode = false,
  versionTier,
  level,
  xp,
  masteryPassiveLabel,
  prioritizeMediaLoading = false,
  upgradeCounts = null,
}: CardProps) {
  const isOnBoard = isBoardMode(boardMode);
  const isDefense = boardMode === "DEFENSE";
  const shouldRenderHologram = isOnBoard && boardMode !== "SET" && !disableHologram;
  const resolvedVersionTier = versionTier ?? card.versionTier ?? 0;
  const resolvedLevel = level ?? card.level ?? 0;
  const resolvedXp = xp ?? card.xp ?? 0;
  const resolvedMasteryPassiveLabel =
    masteryPassiveLabel ?? card.masteryPassiveLabel ?? resolveMasteryPassiveLabel(card.masteryPassiveSkillId ?? null, resolvedVersionTier);
  // Badges de mejoras: la prop manda (override puntual), pero por defecto salen de la carta ya hidratada —
  // así el tablero de combate, el overlay de aplicar y el mercado los muestran sin pasar props extra.
  const resolvedUpgradeCounts = upgradeCounts ?? card.upgradeCounts ?? null;
  const wrapperStyle = clipToFrameShape ? { transformStyle: "preserve-3d" as const, clipPath: CARD_CLIP_PATHS.outer } : { transformStyle: "preserve-3d" as const };

  return (
    <div className="group/card relative h-[380px] w-[260px]" style={wrapperStyle}>
      <CardFrame
        card={card}
        factionStyles={getCardTypeStyles(card)}
        isSelected={isSelected}
        isOnBoard={isOnBoard}
        disableHoverEffects={disableHoverEffects}
        disableDefaultShadow={disableDefaultShadow}
        isPerformanceMode={isPerformanceMode}
        showBackgroundInPerformanceMode={showBackgroundInPerformanceMode}
        onClick={onClick}
        versionTier={resolvedVersionTier}
        level={resolvedLevel}
        xp={resolvedXp}
        masteryPassiveLabel={resolvedMasteryPassiveLabel}
        prioritizeMediaLoading={prioritizeMediaLoading}
        upgradeCounts={resolvedUpgradeCounts}
      />
      {shouldRenderHologram && <CardHologram card={card} isDefense={isDefense} mode={hologramMode} />}
    </div>
  );
}

/** Memoizada: evita re-render cuando el padre repinta con las mismas props (frecuente en el tablero). */
export const Card = memo(CardComponent);
