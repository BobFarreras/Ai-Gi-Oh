// src/components/game/card/internal/CardFrame.tsx - Orquesta el frame de carta desacoplado en cabecera, cuerpo, pie y aura mastery.
import { getCardLevelProgressMetrics } from "@/core/services/progression/card-level-rules";
import { cn } from "@/lib/utils";
import { CardFrameArtAndProgress } from "./CardFrameArtAndProgress";
import { CardFrameFooter } from "./CardFrameFooter";
import { CardFrameHeader } from "./CardFrameHeader";
import { CardFrameMasteryAura } from "./CardFrameMasteryAura";
import { CARD_CLIP_PATHS } from "./styles";
import { ICardFrameProps } from "./card-frame-types";

export function CardFrame({
  card,
  factionStyles,
  isSelected,
  isOnBoard,
  disableHoverEffects = false,
  disableDefaultShadow = false,
  onClick,
  versionTier,
  level,
  xp,
  masteryPassiveLabel,
}: ICardFrameProps) {
  const levelMetrics = getCardLevelProgressMetrics(level, xp);
  const levelProgressWidth = `${Math.round(levelMetrics.progressRatio * 100)}%`;
  const isMasteryTier = versionTier >= 5;
  const descriptionText =
    isMasteryTier && masteryPassiveLabel ? `${masteryPassiveLabel}\n\n${card.description}` : card.description;

  return (
    <>
      <CardFrameMasteryAura isActive={isMasteryTier} />
      <div
        onClick={() => onClick?.(card)}
        style={{ clipPath: CARD_CLIP_PATHS.outer }}
        className={cn(
          "absolute inset-0 z-10 cursor-pointer select-none p-[2px] transition-all duration-300",
          isSelected
            ? "ring-offset-black shadow-[0_0_50px_rgba(251,191,36,0.8)] ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-400 via-white to-slate-400"
            : `${disableDefaultShadow ? "" : "shadow-2xl shadow-black"} ${factionStyles.wrapper}`,
        )}
      >
        <div
          style={{ clipPath: CARD_CLIP_PATHS.inner }}
          className={cn("relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br", factionStyles.inner)}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] bg-[length:200%_200%] animate-[pulse_4s_ease-in-out_infinite]" />
          <CardFrameHeader card={card} versionTier={versionTier} />
          <CardFrameArtAndProgress
            card={card}
            isOnBoard={isOnBoard}
            level={level}
            levelProgressWidth={levelProgressWidth}
            disableHoverEffects={disableHoverEffects}
          />
          <CardFrameFooter card={card} descriptionText={descriptionText} />
        </div>
      </div>
    </>
  );
}
