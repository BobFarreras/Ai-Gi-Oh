// src/components/hub/home/HomeCollectionPanel.tsx - Muestra el almacén de cartas y permite añadir cartas al deck.
import { motion } from "framer-motion";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";

interface HomeCollectionPanelProps {
  deck: IDeck;
  collection: ICollectionCard[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
}

export function HomeCollectionPanel({ deck, collection, selectedCardId, onSelectCard }: HomeCollectionPanelProps) {
  const usedByCardId = new Map<string, number>();
  for (const slot of deck.slots) {
    if (!slot.cardId) continue;
    usedByCardId.set(slot.cardId, (usedByCardId.get(slot.cardId) ?? 0) + 1);
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-cyan-800/35 bg-[#031020]/50 p-2">
      <h2 className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Almacén</h2>
      <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-5 gap-2">
        {collection.map((entry) => {
          const usedCopies = usedByCardId.get(entry.card.id) ?? 0;
          const canAdd = usedCopies < Math.min(3, entry.ownedCopies);
          const isSelected = selectedCardId === entry.card.id;
          return (
            <motion.button
              key={entry.card.id}
              type="button"
              aria-label={`Seleccionar ${entry.card.name}`}
              whileHover={{ y: -2 }}
              onClick={() => onSelectCard(entry.card.id)}
              className={canAdd ? "text-left" : "cursor-not-allowed text-left opacity-60"}
            >
              <HomeMiniCard
                card={entry.card}
                label={`Carta ${entry.card.name}`}
                isSelected={isSelected}
              />
              <p className="mt-0.5 text-center text-[10px] font-semibold text-cyan-200/75">
                En deck: {usedCopies}/{Math.min(3, entry.ownedCopies)}
              </p>
            </motion.button>
          );
        })}
        </div>
      </div>
    </section>
  );
}
