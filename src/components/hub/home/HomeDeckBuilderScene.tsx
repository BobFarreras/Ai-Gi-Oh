// src/components/hub/home/HomeDeckBuilderScene.tsx - Escena principal de Mi Home con interacción de deck y colección.
"use client";

import { DragEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  applyOptimisticAddToDeck,
  applyOptimisticAddToDeckSlot,
  applyOptimisticAddToFusionSlot,
  applyOptimisticRemoveFromDeck,
  applyOptimisticRemoveFromFusion,
} from "@/components/hub/home/internal/optimistic-deck-updates";
import {
  addCardToDeckAction,
  addCardToDeckSlotAction,
  addCardToFusionDeckAction,
  evolveCardVersionAction,
  removeCardFromFusionDeckAction,
  removeCardFromDeckAction,
} from "@/services/home/deck-builder/deck-builder-actions";
import { HOME_DECK_SIZE, HOME_MAX_DUPLICATES, countAssignedCopies, countDeckCopies } from "@/core/services/home/deck-rules";
import { getCopiesNeededForNextVersion } from "@/core/services/progression/card-version-rules";
import { countRender, endInteraction, startInteraction } from "@/services/performance/dev-performance-telemetry";

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
  countRender("HomeDeckBuilderScene");
  const router = useRouter();
  const { play } = useHubModuleSfx();
  const [deck, setDeck] = useState<IDeck>(initialDeck);
  const [collectionState, setCollectionState] = useState<ICollectionCard[]>(collection);
  const [cardProgressById, setCardProgressById] = useState<Map<string, IPlayerCardProgress>>(
    () => new Map(initialCardProgress.map((progress) => [progress.cardId, progress])),
  );
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedFusionSlotIndex, setSelectedFusionSlotIndex] = useState<number | null>(null);
  const [selectedCollectionCardId, setSelectedCollectionCardId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<HomeCollectionTypeFilter>("ALL");
  const [orderField, setOrderField] = useState<HomeCollectionOrderField>("NAME");
  const [orderDirection, setOrderDirection] = useState<HomeCollectionOrderDirection>("ASC");
  const [evolutionOverlay, setEvolutionOverlay] = useState<IEvolutionOverlayState | null>(null);
  const [draggedCard, setDraggedCard] = useState<{ cardId: string; source: "COLLECTION" | "DECK" | "FUSION"; slotIndex?: number } | null>(null);
  const deckMutationIdRef = useRef(0);
  
  const cardById = useMemo(() => new Map(collectionState.map((entry) => [entry.card.id, entry.card])), [collectionState]);
  const selectedCardId = useMemo(() => {
    if (selectedCollectionCardId) return selectedCollectionCardId;
    if (selectedFusionSlotIndex !== null) return deck.fusionSlots[selectedFusionSlotIndex]?.cardId ?? null;
    if (selectedSlotIndex === null) return null;
    return deck.slots[selectedSlotIndex]?.cardId ?? null;
  }, [deck.fusionSlots, deck.slots, selectedCollectionCardId, selectedFusionSlotIndex, selectedSlotIndex]);
  const selectedCard = selectedCardId ? cardById.get(selectedCardId) ?? null : null;
  const selectedSlotHasCard = selectedSlotIndex !== null && deck.slots[selectedSlotIndex].cardId !== null;
  const selectedFusionSlotHasCard = selectedFusionSlotIndex !== null && deck.fusionSlots[selectedFusionSlotIndex].cardId !== null;
  const context = { playerId, deck, collection: collectionState };
  const selectedCardProgress = selectedCardId ? (cardProgressById.get(selectedCardId) ?? null) : null;
  const selectedCardVersionTier = selectedCardProgress?.versionTier ?? 0;
  const selectedCardLevel = selectedCardProgress?.level ?? 0;
  const selectedCardXp = selectedCardProgress?.xp ?? 0;
  const selectedCardMasteryPassiveSkillId = selectedCardProgress?.masteryPassiveSkillId ?? null;
  const deckCardCount = useMemo(() => deck.slots.filter((slot) => slot.cardId !== null).length, [deck.slots]);
  const selectedCardCopies = selectedCardId ? (collectionState.find((entry) => entry.card.id === selectedCardId)?.ownedCopies ?? 0) : 0;
  const selectedCardDeckCopies = selectedCardId ? countDeckCopies(deck, selectedCardId) : 0;
  const selectedCardAssignedCopies = selectedCardId ? countAssignedCopies(deck, selectedCardId) : 0;
  const selectedCardStorageCopies = selectedCardId ? Math.max(0, selectedCardCopies - selectedCardAssignedCopies) : 0;
  const selectedCollectionCardType: string | null = selectedCollectionCardId
    ? (collectionState.find((entry) => entry.card.id === selectedCollectionCardId)?.card.type ?? null)
    : null;
  const firstEmptyFusionSlotIndex = deck.fusionSlots.findIndex((slot) => slot.cardId === null);
  const targetFusionSlotIndex = selectedFusionSlotIndex ?? (firstEmptyFusionSlotIndex >= 0 ? firstEmptyFusionSlotIndex : null);
  const canInsertSelectedCard = Boolean(selectedCollectionCardId) && (
    selectedCollectionCardType === "FUSION"
      ? targetFusionSlotIndex !== null && selectedCardStorageCopies > 0
      : selectedCollectionCardType !== "FUSION" && selectedCardDeckCopies < HOME_MAX_DUPLICATES && selectedCardStorageCopies > 0
  );
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
      const storageCopies = Math.max(0, entry.ownedCopies - countAssignedCopies(deck, entry.card.id));
      if (requiredCopies !== null && storageCopies >= requiredCopies) ids.add(entry.card.id);
    }
    return ids;
  }, [cardProgressById, collectionState, deck]);
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
    if (rawMessage.includes("bloque de fusión")) {
      return "Esta carta es de FUSIÓN. Selecciona un slot del bloque de fusión para equiparla.";
    }
    return rawMessage;
  };
  const beginDeckMutation = (): number => {
    deckMutationIdRef.current += 1;
    return deckMutationIdRef.current;
  };
  const isLatestDeckMutation = (mutationId: number): boolean => mutationId === deckMutationIdRef.current;
  const handleInsertSelectedCard = async (): Promise<IHomeActionResult> => {
    if (!selectedCollectionCardId) return { ok: false, message: "Selecciona una carta del almacén para añadirla." };
    const telemetry = startInteraction("home.insertCard");
    const previousDeck = deck;
    if (selectedCollectionCardType === "FUSION") {
      if (targetFusionSlotIndex === null) {
        const message = "No hay hueco libre en Bloque Fusiones.";
        setErrorMessage(message);
        return { ok: false, message };
      }
      setDeck((currentDeck) => applyOptimisticAddToFusionSlot(currentDeck, targetFusionSlotIndex, selectedCollectionCardId));
      play("ADD_CARD");
      const mutationId = beginDeckMutation();
      try {
        const updatedDeck = await addCardToFusionDeckAction(context, selectedCollectionCardId, targetFusionSlotIndex);
        if (isLatestDeckMutation(mutationId)) {
          setDeck(updatedDeck);
        }
        setErrorMessage(null);
        endInteraction(telemetry, "ok");
        return { ok: true };
      } catch (error) {
        if (isLatestDeckMutation(mutationId)) {
          setDeck(previousDeck);
        }
        const message = getActionErrorMessage(error, "No se pudo equipar la carta en el bloque de fusión.");
        setErrorMessage(message);
        endInteraction(telemetry, "error");
        return { ok: false, message };
      }
    }
    if (selectedCollectionCardType === "FUSION") {
      const message = "Esta carta solo puede añadirse al Bloque Fusiones.";
      setErrorMessage(message);
      endInteraction(telemetry, "error");
      return { ok: false, message };
    }
    play("ADD_CARD");
    setDeck((currentDeck) => applyOptimisticAddToDeck(currentDeck, selectedCollectionCardId));
    const mutationId = beginDeckMutation();
    try {
      const updatedDeck = await addCardToDeckAction(context, selectedCollectionCardId);
      if (isLatestDeckMutation(mutationId)) {
        setDeck(updatedDeck);
      }
      setErrorMessage(null);
      endInteraction(telemetry, "ok");
      return { ok: true };
    } catch (error) {
      if (isLatestDeckMutation(mutationId)) {
        setDeck(previousDeck);
      }
      const message = getActionErrorMessage(error, "No se pudo añadir la carta al deck.");
      setErrorMessage(message);
      endInteraction(telemetry, "error");
      return { ok: false, message };
    }
  };
  const handleRemoveSelectedCard = async (): Promise<IHomeActionResult> => {
    if (selectedSlotIndex === null && selectedFusionSlotIndex === null) {
      return { ok: false, message: "Selecciona una carta del deck para removerla." };
    }
    const telemetry = startInteraction("home.removeCard");
    if (selectedFusionSlotIndex !== null) {
      const previousDeck = deck;
      play("REMOVE_CARD");
      setDeck((currentDeck) => applyOptimisticRemoveFromFusion(currentDeck, selectedFusionSlotIndex));
      const mutationId = beginDeckMutation();
      try {
        const updatedDeck = await removeCardFromFusionDeckAction(context, selectedFusionSlotIndex);
        if (isLatestDeckMutation(mutationId)) {
          setDeck(updatedDeck);
        }
        setErrorMessage(null);
        endInteraction(telemetry, "ok");
        return { ok: true };
      } catch (error) {
        if (isLatestDeckMutation(mutationId)) {
          setDeck(previousDeck);
        }
        const message = getActionErrorMessage(error, "No se pudo retirar la carta del bloque de fusión.");
        setErrorMessage(message);
        endInteraction(telemetry, "error");
        return { ok: false, message };
      }
    }
    const mainSlotIndex = selectedSlotIndex;
    if (mainSlotIndex === null) return { ok: false, message: "Selecciona una carta del deck para removerla." };
    const previousDeck = deck;
    play("REMOVE_CARD");
    setDeck((currentDeck) => applyOptimisticRemoveFromDeck(currentDeck, mainSlotIndex));
    const mutationId = beginDeckMutation();
    try {
      const updatedDeck = await removeCardFromDeckAction(context, mainSlotIndex);
      if (isLatestDeckMutation(mutationId)) {
        setDeck(updatedDeck);
      }
      setErrorMessage(null);
      endInteraction(telemetry, "ok");
      return { ok: true };
    } catch (error) {
      if (isLatestDeckMutation(mutationId)) {
        setDeck(previousDeck);
      }
      const message = getActionErrorMessage(error, "No se pudo remover la carta del deck.");
      setErrorMessage(message);
      endInteraction(telemetry, "error");
      return { ok: false, message };
    }
  };
  const handleEvolveSelectedCard = async (): Promise<IHomeActionResult> => {
    if (!selectedCardId || !canEvolveSelectedCard || copiesRequiredToEvolve === null) {
      return { ok: false, message: "No hay copias libres suficientes en almacén para evolucionar esta carta." };
    }
    const telemetry = startInteraction("home.evolveCard");
    play("EVOLUTION_BUTTON");
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
      endInteraction(telemetry, "ok");
      return { ok: true };
    } catch (error) {
      setCollectionState(previousCollection);
      setCardProgressById(previousProgressById);
      setEvolutionOverlay(null);
      const message = getActionErrorMessage(error, "No se pudo evolucionar la carta seleccionada.");
      setErrorMessage(message);
      endInteraction(telemetry, "error");
      return { ok: false, message };
    }
  };
  const startDragCollectionCard = (cardId: string, event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = "move";
    setDraggedCard({ cardId, source: "COLLECTION" });
  };
  const startDragDeckSlot = (slotIndex: number, event: DragEvent<HTMLElement>) => {
    const cardId = deck.slots[slotIndex]?.cardId;
    if (!cardId) return;
    event.dataTransfer.effectAllowed = "move";
    setDraggedCard({ cardId, source: "DECK", slotIndex });
  };
  const startDragFusionSlot = (slotIndex: number, event: DragEvent<HTMLElement>) => {
    const cardId = deck.fusionSlots[slotIndex]?.cardId;
    if (!cardId) return;
    event.dataTransfer.effectAllowed = "move";
    setDraggedCard({ cardId, source: "FUSION", slotIndex });
  };
  const handleDropOnDeckSlot = async (slotIndex: number, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (!draggedCard) return;
    if (draggedCard.source === "FUSION") {
      setErrorMessage("Una carta de FUSIÓN no se puede mover al Deck principal.");
      setDraggedCard(null);
      return;
    }
    if (draggedCard.source === "DECK") {
      if (typeof draggedCard.slotIndex !== "number") {
        setDraggedCard(null);
        return;
      }
      const sourceIndex = draggedCard.slotIndex;
      if (sourceIndex === slotIndex) {
        setDraggedCard(null);
        return;
      }
      const sourceCardId = deck.slots[sourceIndex]?.cardId;
      const targetCardId = deck.slots[slotIndex]?.cardId;
      if (!sourceCardId) {
        setDraggedCard(null);
        return;
      }
      if (targetCardId !== null) {
        setErrorMessage("El slot de destino ya está ocupado.");
        setDraggedCard(null);
        return;
      }
      const previousDeck = deck;
      setDeck((currentDeck) => {
        const withoutSource = applyOptimisticRemoveFromDeck(currentDeck, sourceIndex);
        return applyOptimisticAddToDeckSlot(withoutSource, slotIndex, sourceCardId);
      });
      play("ADD_CARD");
      const mutationId = beginDeckMutation();
      try {
        const deckAfterRemove = await removeCardFromDeckAction(context, sourceIndex);
        const finalDeck = await addCardToDeckSlotAction({ ...context, deck: deckAfterRemove }, sourceCardId, slotIndex);
        if (isLatestDeckMutation(mutationId)) {
          setDeck(finalDeck);
        }
        setSelectedSlotIndex(slotIndex);
        setSelectedCollectionCardId(null);
        setErrorMessage(null);
      } catch (error) {
        if (isLatestDeckMutation(mutationId)) {
          setDeck(previousDeck);
        }
        setErrorMessage(getActionErrorMessage(error, "No se pudo mover la carta al slot de deck."));
      } finally {
        setDraggedCard(null);
      }
      return;
    }
    const droppedCard = collectionState.find((entry) => entry.card.id === draggedCard.cardId)?.card;
    if (!droppedCard) {
      setDraggedCard(null);
      return;
    }
    if (droppedCard.type === "FUSION") {
      setErrorMessage("Las cartas de FUSIÓN solo se pueden colocar en Bloque Fusiones.");
      setDraggedCard(null);
      return;
    }
    const previousDeck = deck;
    if (previousDeck.slots[slotIndex]?.cardId !== null) {
      setErrorMessage("Ese slot ya está ocupado. Libéralo antes de mover una carta.");
      setDraggedCard(null);
      return;
    }
    setDeck((currentDeck) => applyOptimisticAddToDeckSlot(currentDeck, slotIndex, draggedCard.cardId));
    play("ADD_CARD");
    const mutationId = beginDeckMutation();
    try {
      const updatedDeck = await addCardToDeckSlotAction(context, draggedCard.cardId, slotIndex);
      if (isLatestDeckMutation(mutationId)) {
        setDeck(updatedDeck);
      }
      setSelectedCollectionCardId(draggedCard.cardId);
      setErrorMessage(null);
    } catch (error) {
      if (isLatestDeckMutation(mutationId)) {
        setDeck(previousDeck);
      }
      setErrorMessage(getActionErrorMessage(error, "No se pudo colocar la carta en el slot de deck."));
    } finally {
      setDraggedCard(null);
    }
  };
  const handleDropOnFusionSlot = async (slotIndex: number, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (!draggedCard) return;
    if (draggedCard.source === "DECK") {
      setErrorMessage("Una carta del Deck principal no se puede mover al Bloque Fusiones.");
      setDraggedCard(null);
      return;
    }
    if (draggedCard.source === "FUSION") {
      if (typeof draggedCard.slotIndex !== "number") {
        setDraggedCard(null);
        return;
      }
      const sourceIndex = draggedCard.slotIndex;
      if (sourceIndex === slotIndex) {
        setDraggedCard(null);
        return;
      }
      const sourceCardId = deck.fusionSlots[sourceIndex]?.cardId;
      const targetCardId = deck.fusionSlots[slotIndex]?.cardId;
      if (!sourceCardId) {
        setDraggedCard(null);
        return;
      }
      if (targetCardId !== null) {
        setErrorMessage("El slot de fusión de destino ya está ocupado.");
        setDraggedCard(null);
        return;
      }
      const previousDeck = deck;
      setDeck((currentDeck) => {
        const withoutSource = applyOptimisticRemoveFromFusion(currentDeck, sourceIndex);
        return applyOptimisticAddToFusionSlot(withoutSource, slotIndex, sourceCardId);
      });
      play("ADD_CARD");
      const mutationId = beginDeckMutation();
      try {
        const deckAfterRemove = await removeCardFromFusionDeckAction(context, sourceIndex);
        const finalDeck = await addCardToFusionDeckAction({ ...context, deck: deckAfterRemove }, sourceCardId, slotIndex);
        if (isLatestDeckMutation(mutationId)) {
          setDeck(finalDeck);
        }
        setSelectedFusionSlotIndex(slotIndex);
        setSelectedCollectionCardId(null);
        setErrorMessage(null);
      } catch (error) {
        if (isLatestDeckMutation(mutationId)) {
          setDeck(previousDeck);
        }
        setErrorMessage(getActionErrorMessage(error, "No se pudo mover la carta al Bloque Fusiones."));
      } finally {
        setDraggedCard(null);
      }
      return;
    }
    const droppedCard = collectionState.find((entry) => entry.card.id === draggedCard.cardId)?.card;
    if (!droppedCard) {
      setDraggedCard(null);
      return;
    }
    if (droppedCard.type !== "FUSION") {
      setErrorMessage("Solo cartas de tipo FUSIÓN pueden entrar en Bloque Fusiones.");
      setDraggedCard(null);
      return;
    }
    const previousDeck = deck;
    if (previousDeck.fusionSlots[slotIndex]?.cardId !== null) {
      setErrorMessage("Ese slot de Bloque Fusiones ya está ocupado.");
      setDraggedCard(null);
      return;
    }
    setDeck((currentDeck) => applyOptimisticAddToFusionSlot(currentDeck, slotIndex, draggedCard.cardId));
    play("ADD_CARD");
    const mutationId = beginDeckMutation();
    try {
      const updatedDeck = await addCardToFusionDeckAction(context, draggedCard.cardId, slotIndex);
      if (isLatestDeckMutation(mutationId)) {
        setDeck(updatedDeck);
      }
      setSelectedCollectionCardId(draggedCard.cardId);
      setErrorMessage(null);
    } catch (error) {
      if (isLatestDeckMutation(mutationId)) {
        setDeck(previousDeck);
      }
      setErrorMessage(getActionErrorMessage(error, "No se pudo colocar la carta en Bloque Fusiones."));
    } finally {
      setDraggedCard(null);
    }
  };
  const handleDropOnCollectionArea = async (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (!draggedCard) return;
    if (draggedCard.source === "DECK" && typeof draggedCard.slotIndex === "number") {
      const slotIndex = draggedCard.slotIndex;
      const previousDeck = deck;
      setDeck((currentDeck) => applyOptimisticRemoveFromDeck(currentDeck, slotIndex));
      play("REMOVE_CARD");
      const mutationId = beginDeckMutation();
      try {
        const updatedDeck = await removeCardFromDeckAction(context, slotIndex);
        if (isLatestDeckMutation(mutationId)) {
          setDeck(updatedDeck);
        }
        setErrorMessage(null);
      } catch (error) {
        if (isLatestDeckMutation(mutationId)) {
          setDeck(previousDeck);
        }
        setErrorMessage(getActionErrorMessage(error, "No se pudo devolver la carta al almacén."));
      }
    }
    if (draggedCard.source === "FUSION" && typeof draggedCard.slotIndex === "number") {
      const slotIndex = draggedCard.slotIndex;
      const previousDeck = deck;
      setDeck((currentDeck) => applyOptimisticRemoveFromFusion(currentDeck, slotIndex));
      play("REMOVE_CARD");
      const mutationId = beginDeckMutation();
      try {
        const updatedDeck = await removeCardFromFusionDeckAction(context, slotIndex);
        if (isLatestDeckMutation(mutationId)) {
          setDeck(updatedDeck);
        }
        setErrorMessage(null);
      } catch (error) {
        if (isLatestDeckMutation(mutationId)) {
          setDeck(previousDeck);
        }
        setErrorMessage(getActionErrorMessage(error, "No se pudo devolver la carta al almacén."));
      }
    }
    setDraggedCard(null);
  };
  const handleBackToHub = () => {
    if (deckCardCount < HOME_DECK_SIZE) {
      play("ERROR_COMMON");
      setErrorMessage(`Deck incompleto (${deckCardCount}/${HOME_DECK_SIZE}). Completa 20 cartas antes de salir de Arsenal.`);
      return;
    }
    router.push("/hub");
  };

  return (
    <main className="hub-control-room-bg relative box-border w-full h-[100dvh] overflow-hidden px-3 py-3 text-slate-100 sm:px-5 flex flex-col justify-center items-center">
      
      <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-screen-2xl min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] backdrop-blur-xl sm:p-4 transition-all">
        
        {/* REFACTOR: Barra Maestra Unificada */}
        <div className="shrink-0 z-20">
          <HomeDeckActionBar
            deckCount={deckCardCount}
            deckSize={HOME_DECK_SIZE}
            canInsert={canInsertSelectedCard}
            canRemove={selectedSlotHasCard || selectedFusionSlotHasCard}
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
            onBackToHub={handleBackToHub}
          />
        </div>

        <HomeResponsiveWorkspace
          deck={deck}
          collectionState={collectionState}
          filteredCollection={filteredCollection}
          cardProgressById={cardProgressById}
          evolvableCardIds={evolvableCardIds}
          selectedSlotIndex={selectedSlotIndex}
          selectedFusionSlotIndex={selectedFusionSlotIndex}
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
          canRemoveSelectedCard={selectedSlotHasCard || selectedFusionSlotHasCard}
          canEvolveSelectedCard={canEvolveSelectedCard}
          evolveCostForSelectedCard={copiesRequiredToEvolve}
          onInsertSelectedCard={handleInsertSelectedCard}
          onRemoveSelectedCard={handleRemoveSelectedCard}
          onEvolveSelectedCard={handleEvolveSelectedCard}
          onClearError={() => setErrorMessage(null)}
          onSelectSlot={(slotIndex) => {
            setErrorMessage(null);
            setSelectedCollectionCardId(null);
            setSelectedFusionSlotIndex(null);
            const cardId = deck.slots[slotIndex]?.cardId ?? null;
            setSelectedSlotIndex((previous) => (previous === slotIndex ? null : slotIndex));
            if (cardId && selectedSlotIndex !== slotIndex) play("DETAIL_OPEN");
          }}
          onSelectFusionSlot={(slotIndex) => {
            setErrorMessage(null);
            setSelectedCollectionCardId(null);
            setSelectedSlotIndex(null);
            const cardId = deck.fusionSlots[slotIndex]?.cardId ?? null;
            setSelectedFusionSlotIndex((previous) => (previous === slotIndex ? null : slotIndex));
            if (cardId && selectedFusionSlotIndex !== slotIndex) play("DETAIL_OPEN");
          }}
          onSelectCollectionCard={(cardId) => {
            setErrorMessage(null);
            setSelectedSlotIndex(null);
            setSelectedCollectionCardId((previous) => (previous === cardId ? null : cardId));
            if (selectedCollectionCardId !== cardId) play("DETAIL_OPEN");
          }}
          onStartDragCollectionCard={startDragCollectionCard}
          onStartDragDeckSlot={startDragDeckSlot}
          onStartDragFusionSlot={startDragFusionSlot}
          onDropOnDeckSlot={(slotIndex, event) => {
            void handleDropOnDeckSlot(slotIndex, event);
          }}
          onDropOnFusionSlot={(slotIndex, event) => {
            void handleDropOnFusionSlot(slotIndex, event);
          }}
          onDropOnCollectionArea={(event) => {
            void handleDropOnCollectionArea(event);
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
