// src/components/hub/home/layout/internal/HomeMobileCollectionPanel.tsx - Renderiza grilla móvil de colección con estado de copias y evolución.
import { motion } from "framer-motion";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";
import { IHomeWorkspaceProps } from "@/components/hub/home/layout/home-workspace-types";

interface IHomeMobileCollectionPanelProps {
  props: IHomeWorkspaceProps;
  deckCopiesByCardId: Map<string, number>;
  onSelectCollectionCard: (cardId: string) => void;
}

export function HomeMobileCollectionPanel({ props, deckCopiesByCardId, onSelectCollectionCard }: IHomeMobileCollectionPanelProps) {
  return (
    <div className="grid grid-cols-4 gap-1 pb-6 pt-1" onDragOver={(event) => event.preventDefault()} onDrop={props.onDropOnCollectionArea}>
      {props.filteredCollection.map((entry) => {
        const usedCopies = deckCopiesByCardId.get(entry.card.id) ?? 0;
        const availableCopies = Math.max(0, entry.ownedCopies - usedCopies);
        const canAdd = usedCopies < Math.min(3, entry.ownedCopies);
        const isSelected = props.selectedCollectionCardId === entry.card.id;
        const progress = props.cardProgressById.get(entry.card.id);
        const canEvolve = props.evolvableCardIds.has(entry.card.id);
        return (
          <motion.div
            key={entry.card.id}
            className={`relative flex flex-col items-center transition-opacity ${canAdd ? "cursor-pointer" : "cursor-not-allowed opacity-40 grayscale-[50%]"}`}
            animate={canEvolve ? { rotate: [0, -1.2, 1.2, -0.8, 0.8, 0] } : {}}
            transition={canEvolve ? { duration: 0.38, repeat: Infinity, repeatDelay: 1.8 } : {}}
          >
            <HomeMiniCard
              card={entry.card}
              label={`Carta ${entry.card.name}`}
              isSelected={isSelected}
              onClick={() => onSelectCollectionCard(entry.card.id)}
              isDraggable
              onDragStart={(event) => props.onStartDragCollectionCard(entry.card.id, event)}
              showSlotContainer={false}
              size="mobileLarge"
              versionTier={progress?.versionTier ?? 0}
              level={progress?.level ?? 0}
              xp={progress?.xp ?? 0}
              masteryPassiveSkillId={progress?.masteryPassiveSkillId ?? null}
              isPerformanceMode
              showBackgroundInPerformanceMode
            />
            <span className="mt-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-cyan-200">D {usedCopies}/{Math.min(3, entry.ownedCopies)} U {availableCopies}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
