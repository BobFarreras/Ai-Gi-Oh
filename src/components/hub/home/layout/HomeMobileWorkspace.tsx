// src/components/hub/home/layout/HomeMobileWorkspace.tsx - Layout mobile del Arsenal con tabs Deck/Almacén e inspector modal.
"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { HomeCardInspectorDialog } from "@/components/hub/home/HomeCardInspectorDialog";
import { buildHomeMobileDeckSlotsView } from "@/components/hub/home/layout/home-mobile-deck-view";
import { HomeMobileSectionTabs } from "@/components/hub/home/layout/HomeMobileSectionTabs";
import { IInspectorOrigin } from "@/components/hub/internal/mobile-inspector-animation";
import { IHomeWorkspaceProps } from "@/components/hub/home/layout/home-workspace-types";
import { HomeMobileDeckPanel } from "@/components/hub/home/layout/internal/HomeMobileDeckPanel";
import { HomeMobileCollectionPanel } from "@/components/hub/home/layout/internal/HomeMobileCollectionPanel";

type IMobileSection = "DECK" | "COLLECTION";
type ISelectedCardSource = "DECK" | "COLLECTION" | "NONE";

export function HomeMobileWorkspace(props: IHomeWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<IMobileSection>("DECK");
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorOrigin, setInspectorOrigin] = useState<IInspectorOrigin>({ x: 0, y: 0 });
  const cardById = useMemo(() => new Map(props.collectionState.map((entry) => [entry.card.id, entry.card])), [props.collectionState]);
  const deckCopiesByCardId = useMemo(() => {
    const copies = new Map<string, number>();
    for (const slot of props.deck.slots) {
      if (!slot.cardId) continue;
      copies.set(slot.cardId, (copies.get(slot.cardId) ?? 0) + 1);
    }
    for (const slot of props.deck.fusionSlots) {
      if (!slot.cardId) continue;
      copies.set(slot.cardId, (copies.get(slot.cardId) ?? 0) + 1);
    }
    return copies;
  }, [props.deck.fusionSlots, props.deck.slots]);
  const deckCount = props.deck.slots.filter((slot) => slot.cardId !== null).length;
  const deckSlotsForView = buildHomeMobileDeckSlotsView({
    deck: props.deck,
    cardById,
    nameQuery: props.nameQuery,
    typeFilter: props.typeFilter,
  });
  const selectedCardSource: ISelectedCardSource =
    props.selectedCollectionCardId
      ? "COLLECTION"
      : (props.selectedSlotIndex !== null && props.deck.slots[props.selectedSlotIndex]?.cardId) ||
          (props.selectedFusionSlotIndex !== null && props.deck.fusionSlots[props.selectedFusionSlotIndex]?.cardId)
        ? "DECK"
        : "NONE";
  const capturePointerOrigin = (event: PointerEvent<HTMLDivElement>) => {
    setInspectorOrigin({ x: event.clientX, y: event.clientY });
  };
  const handleSelectSlot = (slotIndex: number) => {
    const slotCardId = props.deck.slots[slotIndex]?.cardId ?? null;
    props.onSelectSlot(slotIndex);
    if (slotCardId) setIsInspectorOpen(true);
  };
  const handleSelectCollectionCard = (cardId: string) => {
    props.onSelectCollectionCard(cardId);
    setIsInspectorOpen(true);
  };
  const handleSelectFusionSlot = (slotIndex: number) => {
    const slotCardId = props.deck.fusionSlots[slotIndex]?.cardId ?? null;
    props.onSelectFusionSlot(slotIndex);
    if (slotCardId) setIsInspectorOpen(true);
  };

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 xl:hidden" onPointerDownCapture={capturePointerOrigin}>
      <HomeMobileSectionTabs activeSection={activeSection} onChangeSection={setActiveSection} />
      <section className="min-h-0 flex-1 rounded-xl border border-cyan-900/40 bg-[#020b16]/75 p-3 shadow-[0_0_20px_rgba(6,78,100,0.2)]">
        <div className="mb-3 flex items-center justify-between border-b border-cyan-900/45 pb-2">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
            {activeSection === "DECK" ? "Deck Activo" : "Almacén"}
          </h2>
          <span className="text-xs font-bold text-cyan-100/80">
            {activeSection === "DECK" ? `${deckCount}/20` : `${props.filteredCollection.length} cartas`}
          </span>
        </div>
        <div className="home-modern-scroll h-[calc(100%-2.25rem)] overflow-y-auto overflow-x-hidden pt-2">
          {activeSection === "DECK" ? (
            <HomeMobileDeckPanel
              props={props}
              cardById={cardById}
              deckSlotsForView={deckSlotsForView}
              onSelectSlot={handleSelectSlot}
              onSelectFusionSlot={handleSelectFusionSlot}
            />
          ) : (
            <HomeMobileCollectionPanel props={props} deckCopiesByCardId={deckCopiesByCardId} onSelectCollectionCard={handleSelectCollectionCard} />
          )}
        </div>
      </section>
      <HomeCardInspectorDialog
        isOpen={isInspectorOpen}
        origin={inspectorOrigin}
        selectedCard={props.selectedCard}
        selectedCardVersionTier={props.selectedCardVersionTier}
        selectedCardLevel={props.selectedCardLevel}
        selectedCardXp={props.selectedCardXp}
        selectedCardMasteryPassiveSkillId={props.selectedCardMasteryPassiveSkillId}
        selectedCardSource={selectedCardSource}
        canInsert={selectedCardSource === "COLLECTION" && props.canInsertSelectedCard}
        canRemove={selectedCardSource === "DECK" && props.canRemoveSelectedCard}
        canEvolve={selectedCardSource === "COLLECTION" && props.canEvolveSelectedCard}
        evolveCost={props.evolveCostForSelectedCard}
        onInsert={props.onInsertSelectedCard}
        onRemove={props.onRemoveSelectedCard}
        onEvolve={props.onEvolveSelectedCard}
        onClose={() => setIsInspectorOpen(false)}
      />
    </div>
  );
}
