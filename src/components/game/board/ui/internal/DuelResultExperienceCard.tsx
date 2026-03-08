// src/components/game/board/ui/internal/DuelResultExperienceCard.tsx - Renderiza una carta real en overlay de resultado con animación de subida de nivel por pasos.
"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/game/card/Card";
import { ICard } from "@/core/entities/ICard";
import { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";
import { useDuelCardExperienceAnimation } from "./use-duel-card-experience-animation";
import { DuelResultCardDensity } from "./duel-result-card-density";

interface DuelResultExperienceCardProps {
  entry: IAppliedCardExperienceResult;
  card: ICard;
  density: DuelResultCardDensity;
}

const CARD_SCALE_BY_DENSITY: Record<DuelResultCardDensity, number> = {
  compact: 0.46,
  medium: 0.52,
  large: 0.6,
};

const CARD_CONTAINER_BY_DENSITY: Record<DuelResultCardDensity, string> = {
  compact: "h-[176px] w-[120px]",
  medium: "h-[198px] w-[136px]",
  large: "h-[228px] w-[156px]",
};

export function DuelResultExperienceCard({ entry, card, density }: DuelResultExperienceCardProps) {
  const previousTotalXp = Math.max(0, entry.progress.xp - entry.gainedXp);
  const animation = useDuelCardExperienceAnimation({
    oldLevel: entry.oldLevel,
    newLevel: entry.newLevel,
    previousTotalXp,
    currentTotalXp: entry.progress.xp,
  });
  const cardWithProgress: ICard = {
    ...card,
    versionTier: entry.progress.versionTier,
    level: entry.progress.level,
    xp: entry.progress.xp,
    masteryPassiveSkillId: entry.progress.masteryPassiveSkillId,
    masteryPassiveLabel: card.masteryPassiveLabel ?? null,
  };
  const cardScale = CARD_SCALE_BY_DENSITY[density];
  const cardContainerClass = CARD_CONTAINER_BY_DENSITY[density];

  return (
    <motion.article initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative rounded-xl border border-cyan-300/30 bg-[#03101a]/80 p-2">
      <div className="mb-2 text-center text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">EXP TOTAL +{entry.gainedXp}</div>
      <motion.div
        key={`lvl-pulse-${entry.cardId}-${animation.levelUpPulseTick}`}
        animate={{
          boxShadow: ["0 0 0 rgba(34,211,238,0)", "0 0 34px rgba(34,211,238,0.9)", "0 0 0 rgba(34,211,238,0)"],
          scale: [1, 1.035, 1],
          rotate: [0, -0.8, 0.8, 0],
        }}
        transition={{ duration: 0.75 }}
        className={`relative mx-auto origin-top overflow-hidden rounded-lg ${cardContainerClass}`}
      >
        <motion.div
          key={`lvl-flare-${entry.cardId}-${animation.levelUpPulseTick}`}
          animate={{ opacity: [0, 0.8, 0], scale: [0.4, 1.15, 1.35] }}
          transition={{ duration: 0.55 }}
          className="pointer-events-none absolute inset-0 z-20 rounded-lg bg-[radial-gradient(circle,rgba(125,211,252,0.7)_0%,rgba(34,211,238,0.18)_45%,rgba(34,211,238,0)_72%)] mix-blend-screen"
        />
        <div className="pointer-events-none origin-top-left" style={{ transform: `scale(${cardScale})` }}>
          <Card card={cardWithProgress} versionTier={entry.progress.versionTier} level={entry.progress.level} xp={entry.progress.xp} masteryPassiveLabel={cardWithProgress.masteryPassiveLabel ?? null} />
        </div>
      </motion.div>
      <div className="mt-2 space-y-1">
        <p className="truncate text-center text-[11px] font-black uppercase tracking-[0.16em] text-cyan-100">{card.name}</p>
        <p className="text-center text-[11px] text-cyan-200/85">Lv {entry.oldLevel} → {animation.displayLevel}</p>
        <div className="h-2 overflow-hidden rounded-full border border-cyan-300/30 bg-black/55">
          <motion.div
            animate={{ width: `${animation.progressPercent}%` }}
            transition={{ duration: animation.progressPercent === 0 ? 0 : 0.75, ease: "easeOut" }}
            className="h-full bg-cyan-300"
          />
        </div>
      </div>
    </motion.article>
  );
}
