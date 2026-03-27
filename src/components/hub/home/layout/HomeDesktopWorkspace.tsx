// src/components/hub/home/layout/HomeDesktopWorkspace.tsx - Distribución de escritorio para inspector, deck y almacén del Arsenal.
"use client";

import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { HomeCollectionPanel } from "@/components/hub/home/HomeCollectionPanel";
import { HomeDeckPanel } from "@/components/hub/home/HomeDeckPanel";
import { IHomeWorkspaceProps } from "@/components/hub/home/layout/home-workspace-types";

export function HomeDesktopWorkspace(props: IHomeWorkspaceProps) {
  return (
    <div className="mt-4 grid min-h-0 flex-1 gap-4 grid-cols-[1fr_1.8fr_1.2fr]">
      <div className="min-h-0 min-w-0 overflow-visible rounded-xl border border-cyan-900/30 bg-black/40">
        <HomeCardInspector
          selectedCard={props.selectedCard}
          selectedCardVersionTier={props.selectedCardVersionTier}
          selectedCardLevel={props.selectedCardLevel}
          selectedCardXp={props.selectedCardXp}
          selectedCardMasteryPassiveSkillId={props.selectedCardMasteryPassiveSkillId}
        />
      </div>
      <div className="min-h-0 min-w-0 overflow-visible rounded-xl border border-cyan-900/30 bg-black/40">
        <HomeDeckPanel
          deck={props.deck}
          collection={props.collectionState}
          cardProgressById={props.cardProgressById}
          selectedSlotIndex={props.selectedSlotIndex}
          selectedFusionSlotIndex={props.selectedFusionSlotIndex}
          selectedCardId={props.selectedCardId}
          onSelectSlot={props.onSelectSlot}
          onSelectFusionSlot={props.onSelectFusionSlot}
          onStartDragDeckSlot={props.onStartDragDeckSlot}
          onStartDragFusionSlot={props.onStartDragFusionSlot}
          onDropOnDeckSlot={props.onDropOnDeckSlot}
          onDropOnFusionSlot={props.onDropOnFusionSlot}
        />
      </div>
      <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40">
        <HomeCollectionPanel
          deck={props.deck}
          collection={props.filteredCollection}
          cardProgressById={props.cardProgressById}
          evolvableCardIds={props.evolvableCardIds}
          selectedCardId={props.selectedCollectionCardId}
          onSelectCard={props.onSelectCollectionCard}
          onStartDragCollectionCard={props.onStartDragCollectionCard}
          onDropOnCollectionArea={props.onDropOnCollectionArea}
        />
      </div>
    </div>
  );
}
