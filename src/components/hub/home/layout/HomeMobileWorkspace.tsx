// src/components/hub/home/layout/HomeMobileWorkspace.tsx - Layout mobile del Arsenal con tabs Deck/Almacén e inspector modal.
"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { motion } from "framer-motion";
import { HomeCardInspectorDialog } from "@/components/hub/home/HomeCardInspectorDialog";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";
import { buildHomeMobileDeckSlotsView } from "@/components/hub/home/layout/home-mobile-deck-view";
import { HomeMobileSectionTabs } from "@/components/hub/home/layout/HomeMobileSectionTabs";
import { IInspectorOrigin } from "@/components/hub/internal/mobile-inspector-animation";
import { IHomeWorkspaceProps } from "@/components/hub/home/layout/home-workspace-types";

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
            <>
            <div className="grid grid-cols-4 gap-1 pb-3 pt-1">
              {deckSlotsForView.map((slot) => {
                const card = slot.cardId ? (cardById.get(slot.cardId) ?? null) : null;
                const progress = slot.cardId ? (props.cardProgressById.get(slot.cardId) ?? null) : null;
                const isSelected =
                  props.selectedSlotIndex === slot.index ||
                  (slot.cardId !== null && slot.cardId === props.selectedCardId);
                return (
                  <HomeMiniCard
                    key={slot.index}
                    card={card}
                    isSelected={isSelected}
                    label={`Slot ${slot.index + 1}`}
                    onClick={() => handleSelectSlot(slot.index)}
                    isDraggable={card !== null}
                    onDragStart={(event) => props.onStartDragDeckSlot(slot.index, event)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => props.onDropOnDeckSlot(slot.index, event)}
                    showSlotContainer={card === null}
                    size="mobileLarge"
                    versionTier={progress?.versionTier ?? 0}
                    level={progress?.level ?? 0}
                    xp={progress?.xp ?? 0}
                    masteryPassiveSkillId={progress?.masteryPassiveSkillId ?? null}
                  />
                );
              })}
              {deckSlotsForView.length === 0 ? (
                <p className="col-span-4 rounded-lg border border-cyan-900/40 bg-black/30 p-2 text-center text-[11px] text-cyan-200/80">
                  No hay cartas del deck que cumplan el filtro.
                </p>
              ) : null}
            </div>
            <div className="mt-2 rounded-lg border border-fuchsia-800/40 bg-fuchsia-950/15 p-2">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-200">Bloque Fusiones</p>
              <div className="grid grid-cols-2 place-items-center gap-2">
                {props.deck.fusionSlots.map((slot) => {
                  const card = slot.cardId ? (cardById.get(slot.cardId) ?? null) : null;
                  const progress = slot.cardId ? (props.cardProgressById.get(slot.cardId) ?? null) : null;
                  const isSelected =
                    props.selectedFusionSlotIndex === slot.index ||
                    (slot.cardId !== null && slot.cardId === props.selectedCardId);
                  return (
                    <div key={`mobile-fusion-slot-${slot.index}`} className="w-[84px]">
                      <HomeMiniCard
                        card={card}
                        isSelected={isSelected}
                        label={`Fusión ${slot.index + 1}`}
                        onClick={() => handleSelectFusionSlot(slot.index)}
                        isDraggable={card !== null}
                        onDragStart={(event) => props.onStartDragFusionSlot(slot.index, event)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => props.onDropOnFusionSlot(slot.index, event)}
                        showSlotContainer={card === null}
                        size="mobileLarge"
                        versionTier={progress?.versionTier ?? 0}
                        level={progress?.level ?? 0}
                        xp={progress?.xp ?? 0}
                        masteryPassiveSkillId={progress?.masteryPassiveSkillId ?? null}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            </>
          ) : (
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
                    className={`relative flex flex-col items-center transition-opacity ${
                      canAdd ? "cursor-pointer" : "cursor-not-allowed opacity-40 grayscale-[50%]"
                    }`}
                    animate={canEvolve ? { rotate: [0, -1.2, 1.2, -0.8, 0.8, 0] } : {}}
                    transition={canEvolve ? { duration: 0.38, repeat: Infinity, repeatDelay: 1.8 } : {}}
                  >
                    <HomeMiniCard
                      card={entry.card}
                      label={`Carta ${entry.card.name}`}
                      isSelected={isSelected}
                      onClick={() => handleSelectCollectionCard(entry.card.id)}
                      isDraggable
                      onDragStart={(event) => props.onStartDragCollectionCard(entry.card.id, event)}
                      showSlotContainer={false}
                      size="mobileLarge"
                      versionTier={progress?.versionTier ?? 0}
                      level={progress?.level ?? 0}
                      xp={progress?.xp ?? 0}
                      masteryPassiveSkillId={progress?.masteryPassiveSkillId ?? null}
                    />
                    <span className="mt-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-cyan-200">
                      D {usedCopies}/{Math.min(3, entry.ownedCopies)} U {availableCopies}
                    </span>
                  </motion.div>
                );
              })}
            </div>
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
