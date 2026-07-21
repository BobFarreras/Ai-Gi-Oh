// src/components/hub/home/layout/HomeMobileWorkspace.tsx - Layout mobile del Arsenal con tabs Deck/Almacén e inspector modal.
"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { Star } from "lucide-react";
import { resolveCardUpgradeCounts } from "@/core/services/progression/card-upgrade-rules";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";
import { HomeCardInspectorDialog } from "@/components/hub/home/HomeCardInspectorDialog";
import { buildHomeMobileDeckSlotsView } from "@/components/hub/home/layout/home-mobile-deck-view";
import { HomeMobileSectionTabs } from "@/components/hub/home/layout/HomeMobileSectionTabs";
import { IInspectorOrigin } from "@/components/hub/internal/mobile-inspector-animation";
import { IHomeWorkspaceProps } from "@/components/hub/home/layout/home-workspace-types";
import { HomeMobileDeckPanel } from "@/components/hub/home/layout/internal/HomeMobileDeckPanel";
import { HomeMobileCollectionPanel } from "@/components/hub/home/layout/internal/HomeMobileCollectionPanel";

type IMobileSection = "DECK" | "COLLECTION";
type ISelectedCardSource = "DECK" | "COLLECTION" | "NONE";

interface IHomeMobileWorkspaceProps extends IHomeWorkspaceProps {
  tutorialForcedSection?: IMobileSection | null;
  tutorialCurrentStepId?: string | null;
}

export function HomeMobileWorkspace(props: IHomeMobileWorkspaceProps) {
  const [manualActiveSection, setManualActiveSection] = useState<IMobileSection>("DECK");
  const activeSection = props.tutorialForcedSection ?? manualActiveSection;
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorOrigin, setInspectorOrigin] = useState<IInspectorOrigin>({ x: 0, y: 0 });
  // Hidrata con nivel/versión + mejoras para que el deck (y el resto de la vista móvil) muestre las stats reales.
  const cardById = useMemo(
    () => new Map(props.collectionState.map((entry) => [entry.card.id, applyCardProgressionToCard(entry.card, props.cardProgressById.get(entry.card.id) ?? null, props.cardUpgradesById.get(entry.card.id))])),
    [props.cardProgressById, props.cardUpgradesById, props.collectionState],
  );
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
  const forceCloseInspector = props.tutorialCurrentStepId === "arsenal-select-deck-card";
  const forceOpenInspectorForAction =
    (props.tutorialCurrentStepId === "arsenal-remove-deck" && selectedCardSource === "DECK") ||
    ((props.tutorialCurrentStepId === "arsenal-add-deck" || props.tutorialCurrentStepId === "arsenal-open-evolve") &&
      selectedCardSource === "COLLECTION");
  // Exigir carta seleccionada evita el detalle vacío: al re-tocar una carta ya seleccionada, la
  // selección se alterna a null (deselecciona) y sin este guard el diálogo se abriría sin contenido.
  const isInspectorVisible = forceCloseInspector ? false : forceOpenInspectorForAction ? true : (isInspectorOpen && props.selectedCard !== null);
  const isTutorialActionStep = Boolean(forceOpenInspectorForAction);
  const tutorialHighlightTargetId =
    props.tutorialCurrentStepId === "arsenal-add-deck"
      ? "tutorial-home-add-button"
      : props.tutorialCurrentStepId === "arsenal-remove-deck"
        ? "tutorial-home-remove-button"
        : props.tutorialCurrentStepId === "arsenal-open-evolve"
          ? "tutorial-home-evolve-button"
          : null;
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
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3" onPointerDownCapture={capturePointerOrigin}>
      <HomeMobileSectionTabs activeSection={activeSection} onChangeSection={setManualActiveSection} />
      <section className="min-h-0 flex-1 rounded-xl border border-cyan-900/40 bg-[#020b16]/75 p-3 shadow-[0_0_20px_rgba(6,78,100,0.2)]">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-cyan-900/45 pb-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              {activeSection !== "DECK"
                ? "Almacén"
                : props.secondDeck?.editingDeckSlot === "SECONDARY"
                  ? "2º Mazo"
                  : "Deck Activo"}
            </h2>
            {/* Doble Arsenal (móvil): "Hacer principal" vive aquí, en la sección del deck, al editar el 2º mazo. */}
            {activeSection === "DECK" && props.secondDeck?.editingDeckSlot === "SECONDARY" && (
              <button
                type="button"
                disabled={props.secondDeck.busy}
                onClick={props.secondDeck.onActivate}
                aria-label="Hacer principal este mazo"
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-violet-400/60 bg-violet-500/20 px-2 py-0.5 font-display text-[9px] font-black uppercase tracking-widest text-violet-100 transition enabled:hover:bg-violet-500/30 disabled:opacity-50"
              >
                <Star className="h-3 w-3" />
                {props.secondDeck.busy ? "…" : "Hacer principal"}
              </button>
            )}
          </div>
          <span className="shrink-0 text-xs font-bold text-cyan-100/80">
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
        isOpen={isInspectorVisible}
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
        onEquip={props.onEquipSelectedCard}
        equipPendingObjectLabel={props.equipPendingObjectLabel}
        upgradeCounts={resolveCardUpgradeCounts(props.selectedCard ? props.cardUpgradesById.get(props.selectedCard.id) : undefined)}
        onClose={() => setIsInspectorOpen(false)}
        isTutorialActionStep={isTutorialActionStep}
        tutorialHighlightTargetId={tutorialHighlightTargetId}
      />
    </div>
  );
}
