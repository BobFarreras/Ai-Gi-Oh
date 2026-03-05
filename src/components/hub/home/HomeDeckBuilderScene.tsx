// src/components/hub/home/HomeDeckBuilderScene.tsx - Escena principal de Mi Home con interacción de deck y colección.
"use client";

import { useMemo, useState } from "react";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { HomeDeckActionBar } from "@/components/hub/home/HomeDeckActionBar";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { HomeCollectionPanel } from "@/components/hub/home/HomeCollectionPanel";
import { HomeDeckPanel } from "@/components/hub/home/HomeDeckPanel";
import { HomeErrorBanner } from "@/components/hub/home/HomeErrorBanner";
import {
  HomeCollectionOrderDirection,
  HomeCollectionOrderField,
  HomeCollectionTypeFilter,
} from "@/components/hub/home/home-filters";
import { buildHomeCollectionView } from "@/components/hub/home/home-collection-view";
import { applyOptimisticAddToDeck, applyOptimisticRemoveFromDeck } from "@/components/hub/home/internal/optimistic-deck-updates";
import {
  addCardToDeckAction,
  evolveCardVersionAction,
  removeCardFromDeckAction,
} from "@/services/home/deck-builder/deck-builder-actions";
import { getCopiesNeededForNextVersion } from "@/core/services/progression/card-version-rules";

interface HomeDeckBuilderSceneProps {
  playerId: string;
  initialDeck: IDeck;
  collection: ICollectionCard[];
  initialCardProgress: IPlayerCardProgress[];
}

export function HomeDeckBuilderScene({ playerId, initialDeck, collection, initialCardProgress }: HomeDeckBuilderSceneProps) {
  const [deck, setDeck] = useState<IDeck>(initialDeck);
  const [collectionState, setCollectionState] = useState<ICollectionCard[]>(collection);
  const [cardProgressById, setCardProgressById] = useState<Map<string, IPlayerCardProgress>>(
    () => new Map(initialCardProgress.map((progress) => [progress.cardId, progress])),
  );
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedCollectionCardId, setSelectedCollectionCardId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<HomeCollectionTypeFilter>("ALL");
  const [orderField, setOrderField] = useState<HomeCollectionOrderField>("NAME");
  const [orderDirection, setOrderDirection] = useState<HomeCollectionOrderDirection>("ASC");
  
  const cardById = useMemo(() => new Map(collectionState.map((entry) => [entry.card.id, entry.card])), [collectionState]);
  const selectedCardId = useMemo(() => {
    if (selectedCollectionCardId) return selectedCollectionCardId;
    if (selectedSlotIndex === null) return null;
    return deck.slots[selectedSlotIndex]?.cardId ?? null;
  }, [deck.slots, selectedCollectionCardId, selectedSlotIndex]);
  const selectedCard = selectedCardId ? cardById.get(selectedCardId) ?? null : null;
  const selectedSlotHasCard = selectedSlotIndex !== null && deck.slots[selectedSlotIndex].cardId !== null;
  const context = { playerId, deck, collection: collectionState };
  const selectedCardProgress = selectedCardId ? (cardProgressById.get(selectedCardId) ?? null) : null;
  const selectedCardVersionTier = selectedCardProgress?.versionTier ?? 0;
  const selectedCardLevel = selectedCardProgress?.level ?? 0;
  const selectedCardCopies = selectedCardId ? (collectionState.find((entry) => entry.card.id === selectedCardId)?.ownedCopies ?? 0) : 0;
  const copiesRequiredToEvolve = selectedCardId ? getCopiesNeededForNextVersion(selectedCardVersionTier) : null;
  const canEvolveSelectedCard = Boolean(selectedCardId) && copiesRequiredToEvolve !== null && selectedCardCopies >= copiesRequiredToEvolve;
  const setErrorBanner = (error: unknown) =>
    setErrorMessage(error instanceof Error ? error.message : "No se pudo completar la acción del deck.");
  const filteredCollection = useMemo(
    () => buildHomeCollectionView({ collection: collectionState, typeFilter, orderField, orderDirection }),
    [collectionState, orderDirection, orderField, typeFilter],
  );

  return (
    <main className="hub-control-room-bg relative box-border w-full h-[100dvh] overflow-hidden px-3 py-3 text-slate-100 sm:px-5 flex flex-col justify-center items-center">
      
      <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-screen-2xl min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] backdrop-blur-xl sm:p-4 transition-all">
        
        {/* REFACTOR: Barra Maestra Unificada */}
        <div className="shrink-0 z-20">
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
              const previousDeck = deck;
              setDeck((currentDeck) => applyOptimisticAddToDeck(currentDeck, selectedCollectionCardId));
              try {
                const updatedDeck = await addCardToDeckAction(context, selectedCollectionCardId);
                setDeck(updatedDeck);
                setErrorMessage(null);
              } catch (error) {
                setDeck(previousDeck);
                setErrorBanner(error);
              }
            }}
            onRemove={async () => {
              if (selectedSlotIndex === null) return;
              const previousDeck = deck;
              setDeck((currentDeck) => applyOptimisticRemoveFromDeck(currentDeck, selectedSlotIndex));
              try {
                const updatedDeck = await removeCardFromDeckAction(context, selectedSlotIndex);
                setDeck(updatedDeck);
                setErrorMessage(null);
              } catch (error) {
                setDeck(previousDeck);
                setErrorBanner(error);
              }
            }}
            canEvolve={canEvolveSelectedCard}
            evolveCost={copiesRequiredToEvolve}
            onEvolve={async () => {
              if (!selectedCardId || !canEvolveSelectedCard) return;
              try {
                const result = await evolveCardVersionAction(playerId, selectedCardId);
                setCollectionState(result.collection);
                setCardProgressById((current) => {
                  const next = new Map(current);
                  next.set(result.progress.cardId, result.progress);
                  return next;
                });
                setErrorMessage(null);
              } catch (error) {
                setErrorBanner(error);
              }
            }}
          />
        </div>

        {/* Banner de errores (Renderizado condicional para no ocupar espacio vacío) */}
        {errorMessage && (
          <div className="mt-3 shrink-0 animate-in fade-in slide-in-from-top-2">
            <HomeErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />
          </div>
        )}

        {/* Área de Trabajo (Paneles) */}
        <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[1fr_1.8fr_1.2fr]">
          <div className="min-h-0 min-w-0 overflow-hidden rounded-xl bg-black/40 border border-cyan-900/30">
            <HomeCardInspector
              selectedCard={selectedCard}
              selectedCardVersionTier={selectedCardVersionTier}
              selectedCardLevel={selectedCardLevel}
            />
          </div>
          
          <div className="min-h-0 min-w-0 overflow-hidden rounded-xl bg-black/40 border border-cyan-900/30">
            <HomeDeckPanel
              deck={deck}
              collection={collectionState}
              selectedSlotIndex={selectedSlotIndex}
              selectedCardId={selectedCardId}
              onSelectSlot={(slotIndex) => {
                setErrorMessage(null);
                setSelectedCollectionCardId(null);
                setSelectedSlotIndex((previous) => (previous === slotIndex ? null : slotIndex));
              }}
            />
          </div>
          
          <div className="min-h-0 min-w-0 overflow-hidden rounded-xl bg-black/40 border border-cyan-900/30">
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
