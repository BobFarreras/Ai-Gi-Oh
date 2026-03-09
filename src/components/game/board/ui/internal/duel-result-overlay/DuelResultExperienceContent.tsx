// src/components/game/board/ui/internal/duel-result-overlay/DuelResultExperienceContent.tsx - Renderiza estado de carga/vacío/listado de cartas con EXP.
import { motion } from "framer-motion";
import { DuelResultExperienceCard } from "@/components/game/board/ui/internal/duel-result/DuelResultExperienceCard";
import { IDuelResultExperienceContentProps } from "@/components/game/board/ui/internal/duel-result-overlay/types";

export function DuelResultExperienceContent({
  battleExperienceSummary,
  battleExperienceCardLookup,
  isBattleExperiencePending,
  density,
  emptyLabelClassName,
  gridClassName,
  wrapperClassName,
}: IDuelResultExperienceContentProps) {
  if (isBattleExperiencePending) {
    return (
      <div className="flex h-full items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-4 border-cyan-900 border-t-cyan-400"
        />
      </div>
    );
  }

  if (battleExperienceSummary.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={emptyLabelClassName}>Sin datos de experiencia.</p>
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <div className={gridClassName}>
        {battleExperienceSummary.map((entry, index) => {
          const card = battleExperienceCardLookup[entry.cardId];
          if (!card) return null;
          return <DuelResultExperienceCard key={`${entry.cardId}-${index}`} entry={entry} card={card} density={density} />;
        })}
      </div>
    </div>
  );
}

