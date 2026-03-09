// src/components/hub/market/internal/useMarketPurchaseActions.ts - Encapsula compras de cartas/sobres usando store Zustand de Market.
import { MutableRefObject, startTransition, useCallback, useRef } from "react";
import { ICard } from "@/core/entities/ICard";
import { buyMarketCardAction, buyPackAction } from "@/services/market/market-actions";
import { applyOptimisticBuyCard } from "@/components/hub/market/internal/optimistic-market-updates";
import { MarketSceneStoreApi } from "@/components/hub/market/internal/market-scene-store";
import { mapMarketErrorMessage } from "@/components/hub/market/internal/market-error-message";
import { endInteraction, startInteraction } from "@/services/performance/dev-performance-telemetry";

interface UseMarketPurchaseActionsInput {
  store: MarketSceneStoreApi;
  playerId: string;
  play: (id: "BUY_CARD" | "BUY_PACK") => void;
}

function enqueueTask(queueRef: MutableRefObject<Promise<void>>, task: () => Promise<boolean>): Promise<boolean> {
  const next = queueRef.current.then(task, task);
  queueRef.current = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function useMarketPurchaseActions({ store, playerId, play }: UseMarketPurchaseActionsInput) {
  const cardQueueRef = useRef<Promise<void>>(Promise.resolve());
  const packQueueRef = useRef<Promise<void>>(Promise.resolve());
  const isBuyingCardRef = useRef(false);

  const handleBuyCard = useCallback(async (listingId: string): Promise<boolean> => {
    if (isBuyingCardRef.current) return false;
    isBuyingCardRef.current = true;
    return enqueueTask(cardQueueRef, async () => {
      const telemetry = startInteraction("market.buyCard");
      const previous = store.getState();
      const optimistic = applyOptimisticBuyCard(previous.catalog, previous.collection, listingId);
      startTransition(() => store.setState({ catalog: optimistic.catalog, collection: optimistic.collection }));
      try {
        const result = await buyMarketCardAction(playerId, listingId);
        play("BUY_CARD");
        startTransition(() => store.setState({ catalog: result.catalog, transactions: result.transactions, collection: result.collection, errorMessage: null }));
        endInteraction(telemetry, "ok");
        return true;
      } catch (error) {
        startTransition(() => store.setState({ catalog: previous.catalog, transactions: previous.transactions, collection: previous.collection, errorMessage: mapMarketErrorMessage(error, "No se pudo comprar la carta en este momento.") }));
        endInteraction(telemetry, "error");
        return false;
      } finally {
        isBuyingCardRef.current = false;
      }
    });
  }, [playerId, play, store]);

  const handleBuyPack = useCallback(async (packId: string): Promise<boolean> =>
    enqueueTask(packQueueRef, async () => {
      const telemetry = startInteraction("market.buyPack");
      const previous = store.getState();
      const pack = previous.catalog.packs.find((entry) => entry.id === packId);
      startTransition(() => store.setState({ isBuyingPack: true }));
      if (pack && previous.catalog.wallet.nexus >= pack.priceNexus) {
        startTransition(() => store.setState((current) => ({ catalog: { ...current.catalog, wallet: { ...current.catalog.wallet, nexus: current.catalog.wallet.nexus - pack.priceNexus } } })));
      }
      try {
        const result = await buyPackAction(playerId, packId);
        play("BUY_PACK");
        const cardMap = new Map(result.catalog.listings.map((listing) => [listing.card.id, listing.card]));
        const openedCards = result.openedCardIds.map((cardId) => cardMap.get(cardId)).filter((card): card is ICard => Boolean(card));
        startTransition(() => store.setState({ catalog: result.catalog, transactions: result.transactions, collection: result.collection, revealedPackCards: openedCards, isPackRevealOpen: true, errorMessage: null }));
        endInteraction(telemetry, "ok");
        return true;
      } catch (error) {
        startTransition(() => store.setState({ catalog: previous.catalog, transactions: previous.transactions, collection: previous.collection, errorMessage: mapMarketErrorMessage(error, "No se pudo comprar el sobre en este momento.") }));
        endInteraction(telemetry, "error");
        return false;
      } finally {
        startTransition(() => store.setState({ isBuyingPack: false }));
      }
    }), [playerId, play, store]);

  return { handleBuyCard, handleBuyPack };
}
