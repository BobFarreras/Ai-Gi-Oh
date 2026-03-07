// src/components/hub/home/HomeDeckBuilderScene.tsx - Escena principal de Mi Home con interacción de deck y colección.
"use client";

import { useMemo, useState } from "react";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { HomeDeckActionBar } from "@/components/hub/home/HomeDeckActionBar";
import { HubErrorDialog } from "@/components/hub/internal/HubErrorDialog";
import { HomeEvolutionOverlay } from "@/components/hub/home/HomeEvolutionOverlay";
import { HomeResponsiveWorkspace } from "@/components/hub/home/layout/HomeResponsiveWorkspace";
import { IHomeActionResult } from "@/components/hub/home/layout/home-workspace-types";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
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
import { HOME_MAX_DUPLICATES, countDeckCopies } from "@/core/services/home/deck-rules";
import { getCopiesNeededForNextVersion } from "@/core/services/progression/card-version-rules";

interface HomeDeckBuilderSceneProps {
  playerId: string;
  initialDeck: IDeck;
  collection: ICollectionCard[];
  initialCardProgress: IPlayerCardProgress[];
}

interface IEvolutionOverlayState {
  cardId: string;
  fromVersionTier: number;
  toVersionTier: number;
  level: number;
  consumedCopies: number;
}

export function HomeDeckBuilderScene({ playerId, initialDeck, collection, initialCardProgress }: HomeDeckBuilderSceneProps) {
  const { play } = useHubModuleSfx();
  const [deck, setDeck] = useState<IDeck>(initialDeck);
  const [collectionState, setCollectionState] = useState<ICollectionCard[]>(collection);
  const [cardProgressById, setCardProgressById] = useState<Map<string, IPlayerCardProgress>>(
    () => new Map(initialCardProgress.map((progress) => [progress.cardId, progress])),
  );
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedCollectionCardId, setSelectedCollectionCardId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<HomeCollectionTypeFilter>("ALL");
  const [orderField, setOrderField] = useState<HomeCollectionOrderField>("NAME");
  const [orderDirection, setOrderDirection] = useState<HomeCollectionOrderDirection>("ASC");
  const [evolutionOverlay, setEvolutionOverlay] = useState<IEvolutionOverlayState | null>(null);
  
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
  const selectedCardXp = selectedCardProgress?.xp ?? 0;
  const selectedCardMasteryPassiveSkillId = selectedCardProgress?.masteryPassiveSkillId ?? null;
  const deckCardCount = useMemo(() => deck.slots.filter((slot) => slot.cardId !== null).length, [deck.slots]);
  const deckCopiesByCardId = useMemo(() => {
    const copies = new Map<string, number>();
    for (const slot of deck.slots) {
      if (!slot.cardId) continue;
      copies.set(slot.cardId, (copies.get(slot.cardId) ?? 0) + 1);
    }
    return copies;
  }, [deck.slots]);
  const selectedCardCopies = selectedCardId ? (collectionState.find((entry) => entry.card.id === selectedCardId)?.ownedCopies ?? 0) : 0;
  const selectedCardDeckCopies = selectedCardId ? countDeckCopies(deck, selectedCardId) : 0;
  const selectedCardStorageCopies = selectedCardId ? Math.max(0, selectedCardCopies - selectedCardDeckCopies) : 0;
  const canInsertSelectedCard =
    Boolean(selectedCollectionCardId) &&
    selectedCardDeckCopies < HOME_MAX_DUPLICATES &&
    selectedCardStorageCopies > 0;
  const copiesRequiredToEvolve = selectedCardId ? getCopiesNeededForNextVersion(selectedCardVersionTier) : null;
  const canEvolveSelectedCard =
    Boolean(selectedCardId) &&
    copiesRequiredToEvolve !== null &&
    selectedCardStorageCopies >= copiesRequiredToEvolve &&
    evolutionOverlay === null;
  const filteredCollection = useMemo(
    () => buildHomeCollectionView({ collection: collectionState, nameQuery, typeFilter, orderField, orderDirection }),
    [collectionState, nameQuery, orderDirection, orderField, typeFilter],
  );
  const evolvableCardIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of collectionState) {
      const versionTier = cardProgressById.get(entry.card.id)?.versionTier ?? 0;
      const requiredCopies = getCopiesNeededForNextVersion(versionTier);
      const storageCopies = Math.max(0, entry.ownedCopies - (deckCopiesByCardId.get(entry.card.id) ?? 0));
      if (requiredCopies !== null && storageCopies >= requiredCopies) ids.add(entry.card.id);
    }
    return ids;
  }, [cardProgressById, collectionState, deckCopiesByCardId]);
  const evolutionCard = evolutionOverlay ? cardById.get(evolutionOverlay.cardId) ?? selectedCard : null;
  const getActionErrorMessage = (error: unknown, fallback: string): string => {
    const rawMessage = error instanceof Error ? error.message : fallback;
    if (rawMessage.includes("20 cartas")) {
      return "El deck está completo (20/20). Remueve una carta antes de añadir otra.";
    }
    if (rawMessage.includes("3 copias")) {
      return "Ya tienes 3 copias de esta carta en el deck. Elige otra carta o remueve una copia.";
    }
    if (rawMessage.includes("No tienes más copias")) {
      return "No quedan unidades libres en almacén para esta carta. Remueve una copia del deck o compra más.";
    }
    return rawMessage;
  };
  const handleInsertSelectedCard = async (): Promise<IHomeActionResult> => {
    if (!selectedCollectionCardId) return { ok: false, message: "Selecciona una carta del almacén para añadirla." };
    const previousDeck = deck;
    setDeck((currentDeck) => applyOptimisticAddToDeck(currentDeck, selectedCollectionCardId));
    try {
      const updatedDeck = await addCardToDeckAction(context, selectedCollectionCardId);
      setDeck(updatedDeck);
      setErrorMessage(null);
      return { ok: true };
    } catch (error) {
      setDeck(previousDeck);
      const message = getActionErrorMessage(error, "No se pudo añadir la carta al deck.");
      setErrorMessage(message);
      return { ok: false, message };
    }
  };
  const handleRemoveSelectedCard = async (): Promise<IHomeActionResult> => {
    if (selectedSlotIndex === null) return { ok: false, message: "Selecciona una carta del deck para removerla." };
    const previousDeck = deck;
    setDeck((currentDeck) => applyOptimisticRemoveFromDeck(currentDeck, selectedSlotIndex));
    try {
      const updatedDeck = await removeCardFromDeckAction(context, selectedSlotIndex);
      setDeck(updatedDeck);
      setErrorMessage(null);
      return { ok: true };
    } catch (error) {
      setDeck(previousDeck);
      const message = getActionErrorMessage(error, "No se pudo remover la carta del deck.");
      setErrorMessage(message);
      return { ok: false, message };
    }
  };
  const handleEvolveSelectedCard = async (): Promise<IHomeActionResult> => {
    if (!selectedCardId || !canEvolveSelectedCard || copiesRequiredToEvolve === null) {
      return { ok: false, message: "No hay copias libres suficientes en almacén para evolucionar esta carta." };
    }
    const previousVersionTier = selectedCardVersionTier;
    const previousCollection = collectionState;
    const previousProgressById = new Map(cardProgressById);
    const optimisticProgress: IPlayerCardProgress = {
      playerId,
      cardId: selectedCardId,
      versionTier: previousVersionTier + 1,
      level: selectedCardLevel,
      xp: selectedCardProgress?.xp ?? 0,
      masteryPassiveSkillId: selectedCardProgress?.masteryPassiveSkillId ?? null,
      updatedAtIso: new Date().toISOString(),
    };
    setEvolutionOverlay({
      cardId: selectedCardId,
      fromVersionTier: previousVersionTier,
      toVersionTier: optimisticProgress.versionTier,
      level: optimisticProgress.level,
      consumedCopies: copiesRequiredToEvolve,
    });
    setCollectionState((currentCollection) =>
      currentCollection
        .map((entry) =>
          entry.card.id === selectedCardId
            ? { ...entry, ownedCopies: Math.max(0, entry.ownedCopies - copiesRequiredToEvolve) }
            : entry,
        )
        .filter((entry) => entry.ownedCopies > 0),
    );
    setCardProgressById((current) => {
      const next = new Map(current);
      next.set(selectedCardId, optimisticProgress);
      return next;
    });
    try {
      const result = await evolveCardVersionAction(playerId, selectedCardId);
      setCollectionState(result.collection);
      setCardProgressById((current) => {
        const next = new Map(current);
        next.set(result.progress.cardId, result.progress);
        return next;
      });
      setEvolutionOverlay({
        cardId: selectedCardId,
        fromVersionTier: previousVersionTier,
        toVersionTier: result.progress.versionTier,
        level: result.progress.level,
        consumedCopies: result.consumedCopies,
      });
      setTimeout(() => setEvolutionOverlay(null), 2200);
      setErrorMessage(null);
      return { ok: true };
    } catch (error) {
      setCollectionState(previousCollection);
      setCardProgressById(previousProgressById);
      setEvolutionOverlay(null);
      const message = getActionErrorMessage(error, "No se pudo evolucionar la carta seleccionada.");
      setErrorMessage(message);
      return { ok: false, message };
    }
  };

  return (
    <main className="hub-control-room-bg relative box-border w-full h-[100dvh] overflow-hidden px-3 py-3 text-slate-100 sm:px-5 flex flex-col justify-center items-center">
      
      <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-screen-2xl min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] backdrop-blur-xl sm:p-4 transition-all">
        
        {/* REFACTOR: Barra Maestra Unificada */}
        <div className="shrink-0 z-20">
          <HomeDeckActionBar
            deckCount={deckCardCount}
            deckSize={deck.maxSize}
            canInsert={canInsertSelectedCard}
            canRemove={selectedSlotHasCard}
            typeFilter={typeFilter}
            orderField={orderField}
            orderDirection={orderDirection}
            nameQuery={nameQuery}
            onNameQueryChange={setNameQuery}
            onChangeTypeFilter={setTypeFilter}
            onChangeOrderField={setOrderField}
            onToggleOrderDirection={() =>
              setOrderDirection((previousDirection) => (previousDirection === "ASC" ? "DESC" : "ASC"))
            }
            onInsert={handleInsertSelectedCard}
            onRemove={handleRemoveSelectedCard}
            canEvolve={canEvolveSelectedCard}
            evolveCost={copiesRequiredToEvolve}
            onEvolve={handleEvolveSelectedCard}
          />
        </div>

        <HomeResponsiveWorkspace
          deck={deck}
          collectionState={collectionState}
          filteredCollection={filteredCollection}
          cardProgressById={cardProgressById}
          evolvableCardIds={evolvableCardIds}
          selectedSlotIndex={selectedSlotIndex}
          selectedCardId={selectedCardId}
          selectedCollectionCardId={selectedCollectionCardId}
          selectedCard={selectedCard}
          selectedCardVersionTier={selectedCardVersionTier}
          selectedCardLevel={selectedCardLevel}
          selectedCardXp={selectedCardXp}
          selectedCardMasteryPassiveSkillId={selectedCardMasteryPassiveSkillId}
          nameQuery={nameQuery}
          typeFilter={typeFilter}
          canInsertSelectedCard={canInsertSelectedCard}
          canRemoveSelectedCard={selectedSlotHasCard}
          canEvolveSelectedCard={canEvolveSelectedCard}
          evolveCostForSelectedCard={copiesRequiredToEvolve}
          onInsertSelectedCard={handleInsertSelectedCard}
          onRemoveSelectedCard={handleRemoveSelectedCard}
          onEvolveSelectedCard={handleEvolveSelectedCard}
          onClearError={() => setErrorMessage(null)}
          onSelectSlot={(slotIndex) => {
            setErrorMessage(null);
            setSelectedCollectionCardId(null);
            const cardId = deck.slots[slotIndex]?.cardId ?? null;
            setSelectedSlotIndex((previous) => (previous === slotIndex ? null : slotIndex));
            if (cardId && selectedSlotIndex !== slotIndex) play("DETAIL_OPEN");
          }}
          onSelectCollectionCard={(cardId) => {
            setErrorMessage(null);
            setSelectedSlotIndex(null);
            setSelectedCollectionCardId((previous) => (previous === cardId ? null : cardId));
            if (selectedCollectionCardId !== cardId) play("DETAIL_OPEN");
          }}
        />
      </section>
      {evolutionOverlay && (
        <HomeEvolutionOverlay
          card={evolutionCard}
          fromVersionTier={evolutionOverlay.fromVersionTier}
          toVersionTier={evolutionOverlay.toVersionTier}
          level={evolutionOverlay.level}
          consumedCopies={evolutionOverlay.consumedCopies}
        />
      )}
      <HubErrorDialog title="Error de Arsenal" message={errorMessage} onClose={() => setErrorMessage(null)} />
    </main>
  );
}
