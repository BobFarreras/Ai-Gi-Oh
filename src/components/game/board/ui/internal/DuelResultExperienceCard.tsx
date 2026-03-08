// src/components/game/board/ui/internal/DuelResultExperienceCard.tsx
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

export function DuelResultExperienceCard({ entry, card, density }: DuelResultExperienceCardProps) {
  const previousTotalXp = Math.max(0, entry.progress.xp - entry.gainedXp);
  const animation = useDuelCardExperienceAnimation({
    oldLevel: entry.oldLevel,
    newLevel: entry.newLevel,
    previousTotalXp,
    currentTotalXp: entry.progress.xp,
  });
  
  const densityClass =
    density === "compact" ? "w-[128px] sm:w-[150px]" : density === "large" ? "w-[150px] sm:w-[182px]" : "w-[140px] sm:w-[170px]";

  const cardWithProgress: ICard = {
    ...card,
    versionTier: entry.progress.versionTier,
    level: entry.progress.level,
    xp: entry.progress.xp,
    masteryPassiveSkillId: entry.progress.masteryPassiveSkillId,
    masteryPassiveLabel: card.masteryPassiveLabel ?? null,
  };

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      // ELIMINADOS LOS BORDES: Fondo translúcido mínimo para que parezcan hologramas flotantes
      className={`relative flex flex-col ${densityClass} shrink-0 rounded-xl bg-black/20 p-3 transition-colors hover:bg-black/40`}
    >
      {/* Etiqueta Superior: EXP Ganada */}
      <div className="mb-3 flex justify-center">
        <div className="rounded-sm bg-amber-500/10 px-3 py-1">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-amber-300 drop-shadow-md">
            +{entry.gainedXp} EXP
          </span>
        </div>
      </div>

      {/* Contenedor de la Carta */}
      <motion.div
        key={`lvl-pulse-${entry.cardId}-${animation.levelUpPulseTick}`}
        animate={{
          scale: animation.levelUpPulseTick > 0 ? [1, 1.05, 1] : 1,
          filter: animation.levelUpPulseTick > 0 ? ["brightness(1)", "brightness(1.5)", "brightness(1)"] : "brightness(1)"
        }}
        transition={{ duration: 0.6 }}
        className="relative flex items-center justify-center h-[140px] sm:h-[180px] w-full"
      >
        {/* Flare de Level Up */}
        <motion.div
          key={`lvl-flare-${entry.cardId}-${animation.levelUpPulseTick}`}
          animate={animation.levelUpPulseTick > 0 ? { opacity: [0, 1, 0], scale: [0.5, 1.2, 1.5] } : { opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle,rgba(34,211,238,0.6)_0%,transparent_70%)] mix-blend-screen"
        />
        
        <div className="origin-center transform scale-[0.45] sm:scale-[0.55]">
          <Card 
            card={cardWithProgress} 
            versionTier={entry.progress.versionTier} 
            level={entry.progress.level} 
            xp={entry.progress.xp} 
            masteryPassiveLabel={cardWithProgress.masteryPassiveLabel ?? null} 
            disableHoverEffects 
          />
        </div>
      </motion.div>

      {/* Footer de la Carta */}
      <div className="mt-3 pt-3 flex flex-col justify-end">
        <p className="truncate text-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90 mb-1.5">
          {card.name}
        </p>
        
        <div className="flex justify-between items-center px-1 mb-1.5">
          <span className="text-[9px] sm:text-[10px] font-bold text-cyan-500 uppercase tracking-wider">Lv {entry.oldLevel}</span>
          <span className="text-[9px] sm:text-[10px] font-black text-cyan-300 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Lv {animation.displayLevel}</span>
        </div>
        
        {/* Barra de Progreso */}
        <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-zinc-950/80 shadow-inner">
          <motion.div
            animate={{ width: `${animation.progressPercent}%` }}
            transition={{ duration: animation.progressPercent === 0 ? 0 : 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
          />
        </div>
      </div>
    </motion.article>
  );
}
