// src/components/hub/home/HomeDeckBuilderScene.tsx - Orquesta la experiencia visual y acciones del deck builder en Mi Home.
"use client";

import { useMemo, useState } from "react";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { HomeDeckActionBar } from "@/components/hub/home/HomeDeckActionBar";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { HomeCollectionPanel } from "@/components/hub/home/HomeCollectionPanel";
import { HomeDeckPanel } from "@/components/hub/home/HomeDeckPanel";
import { HomeDeckHeader } from "@/components/hub/home/HomeDeckHeader";
import { HomeErrorBanner } from "@/components/hub/home/HomeErrorBanner";
import {
  HomeCollectionOrderDirection,
  HomeCollectionOrderField,
  HomeCollectionTypeFilter,
} from "@/components/hub/home/home-filters";
import { buildHomeCollectionView } from "@/components/hub/home/home-collection-view";
import {
  addCardToDeckAction,
  removeCardFromDeckAction,
  saveDeckAction,
} from "@/services/home/deck-builder/deck-builder-actions";

interface HomeDeckBuilderSceneProps {
  playerId: string;
  initialDeck: IDeck;
  collection: ICollectionCard[];
}

export function HomeDeckBuilderScene({ playerId, initialDeck, collection }: HomeDeckBuilderSceneProps) {
  const [deck, setDeck] = useState<IDeck>(initialDeck);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedCollectionCardId, setSelectedCollectionCardId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<HomeCollectionTypeFilter>("ALL");
  const [orderField, setOrderField] = useState<HomeCollectionOrderField>("NAME");
  const [orderDirection, setOrderDirection] = useState<HomeCollectionOrderDirection>("ASC");
  const filledSlots = useMemo(() => deck.slots.filter((slot) => slot.cardId !== null).length, [deck.slots]);
  const cardById = useMemo(() => new Map(collection.map((entry) => [entry.card.id, entry.card])), [collection]);
  const selectedCardId = useMemo(() => {
    if (selectedCollectionCardId) return selectedCollectionCardId;
    if (selectedSlotIndex === null) return null;
    return deck.slots[selectedSlotIndex]?.cardId ?? null;
  }, [deck.slots, selectedCollectionCardId, selectedSlotIndex]);
  const selectedCard = selectedCardId ? cardById.get(selectedCardId) ?? null : null;
  const selectedSlotHasCard = selectedSlotIndex !== null && deck.slots[selectedSlotIndex].cardId !== null;
  const context = { playerId, deck, collection };
  const setErrorBanner = (error: unknown) =>
    setErrorMessage(error instanceof Error ? error.message : "No se pudo completar la acción del deck.");
  const filteredCollection = useMemo(
    () => buildHomeCollectionView({ collection, typeFilter, orderField, orderDirection }),
    [collection, orderDirection, orderField, typeFilter],
  );

  return (
    <main className="hub-control-room-bg box-border h-full max-h-full overflow-hidden px-3 py-3 text-slate-100 sm:px-5">
      <section className="mx-auto flex h-full w-full max-w-425 min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] sm:p-4">
        <HomeDeckHeader filledCards={filledSlots} />
        <div className="mt-3">
          <HomeErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />
        </div>
        <div className="mt-3">
          <HomeDeckActionBar
            canInsert={Boolean(selectedCollectionCardId)}
            canRemove={selectedSlotHasCard}
            typeFilter={typeFilter}
            orderField={orderField}
            orderDirection={orderDirection}
            onChangeTypeFilter={setTypeFilter}
            onChangeOrderField={setOrderField}
            onToggleOrderDirection={() =>
              setOrderDirection((previousDirection) => (previousDirection === "ASC" ? "DESC" : "ASC"))
            }
            onInsert={async () => {
              if (!selectedCollectionCardId) return;
              try {
                const updatedDeck = await addCardToDeckAction(context, selectedCollectionCardId);
                setDeck(updatedDeck);
                setErrorMessage(null);
              } catch (error) {
                setErrorBanner(error);
              }
            }}
            onRemove={async () => {
              if (selectedSlotIndex === null) return;
              try {
                const updatedDeck = await removeCardFromDeckAction(context, selectedSlotIndex);
                setDeck(updatedDeck);
                setErrorMessage(null);
              } catch (error) {
                setErrorBanner(error);
              }
            }}
            onSave={async () => {
              try {
                const savedDeck = await saveDeckAction(context);
                setDeck(savedDeck);
                setErrorMessage(null);
              } catch (error) {
                setErrorBanner(error);
              }
            }}
          />
        </div>
        <div className="mt-3 grid min-h-0 flex-1 gap-3 xl:grid-cols-[0.95fr_1.7fr_1.2fr]">
          <div className="min-h-0 min-w-0 overflow-hidden">
            <HomeCardInspector selectedCard={selectedCard} />
          </div>
          <div className="min-h-0 min-w-0 overflow-hidden">
            <HomeDeckPanel
              deck={deck}
              collection={collection}
              selectedSlotIndex={selectedSlotIndex}
              selectedCardId={selectedCardId}
              onSelectSlot={(slotIndex) => {
                setErrorMessage(null);
                setSelectedCollectionCardId(null);
                setSelectedSlotIndex((previous) => (previous === slotIndex ? null : slotIndex));
              }}
            />
          </div>
          <div className="min-h-0 min-w-0 overflow-hidden">
            <HomeCollectionPanel
              deck={deck}
              collection={filteredCollection}
              selectedCardId={selectedCollectionCardId}
              onSelectCard={(cardId) => {
                setErrorMessage(null);
                setSelectedSlotIndex(null);
                setSelectedCollectionCardId((previous) => (previous === cardId ? null : cardId));
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
