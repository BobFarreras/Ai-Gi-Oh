// src/components/hub/home/HomeFusionDeckPanel.tsx - Panel compacto del bloque de fusión con 2 slots dedicados en Arsenal.
import { IDeck } from "@/core/entities/home/IDeck";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";

interface HomeFusionDeckPanelProps {
  deck: IDeck;
  collection: ICollectionCard[];
  cardProgressById: Map<string, IPlayerCardProgress>;
  selectedFusionSlotIndex: number | null;
  selectedCardId: string | null;
  onSelectFusionSlot: (slotIndex: number) => void;
}

export function HomeFusionDeckPanel({
  deck,
  collection,
  cardProgressById,
  selectedFusionSlotIndex,
  selectedCardId,
  onSelectFusionSlot,
}: HomeFusionDeckPanelProps) {
  const cardById = new Map(collection.map((entry) => [entry.card.id, entry.card]));
  return (
    <section className="mt-3 rounded-2xl border border-fuchsia-700/40 bg-[#120617]/65 p-3">
      <div className="mb-2 flex items-center justify-between border-b border-fuchsia-900/50 pb-2">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-200">Bloque Fusión</h3>
        <p className="text-[11px] font-semibold text-fuchsia-100/80">
          {deck.fusionSlots.filter((slot) => slot.cardId !== null).length}/2
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {deck.fusionSlots.map((slot) => {
          const card = slot.cardId ? cardById.get(slot.cardId) ?? null : null;
          const progress = slot.cardId ? cardProgressById.get(slot.cardId) ?? null : null;
          const isSelected = selectedFusionSlotIndex === slot.index || (slot.cardId !== null && selectedCardId === slot.cardId);
          return (
            <HomeMiniCard
              key={`fusion-slot-${slot.index}`}
              card={card}
              isSelected={isSelected}
              label={`Fusión ${slot.index + 1}`}
              onClick={() => onSelectFusionSlot(slot.index)}
              showSlotContainer={card === null}
              versionTier={progress?.versionTier ?? 0}
              level={progress?.level ?? 0}
              xp={progress?.xp ?? 0}
              masteryPassiveSkillId={progress?.masteryPassiveSkillId ?? null}
            />
          );
        })}
      </div>
    </section>
  );
}
