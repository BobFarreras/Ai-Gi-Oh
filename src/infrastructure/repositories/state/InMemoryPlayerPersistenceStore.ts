// src/infrastructure/repositories/state/InMemoryPlayerPersistenceStore.ts - Implementación in-memory de almacenamiento compartido para estado de jugador.
import { IDeck } from "@/core/entities/home/IDeck";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IPlayerWallet } from "@/core/entities/market/IPlayerWallet";
import { IPlayerPersistenceStore } from "@/infrastructure/repositories/state/IPlayerPersistenceStore";

export class InMemoryPlayerPersistenceStore implements IPlayerPersistenceStore {
  private readonly wallets = new Map<string, IPlayerWallet>();
  private readonly collections = new Map<string, Map<string, number>>();
  private readonly decks = new Map<string, IDeck>();
  private readonly transactions: IMarketTransaction[] = [];

  getWallet(playerId: string): IPlayerWallet | null {
    return this.wallets.get(playerId) ?? null;
  }

  saveWallet(wallet: IPlayerWallet): void {
    this.wallets.set(wallet.playerId, { ...wallet });
  }

  getCollectionCounts(playerId: string): Map<string, number> | null {
    return this.collections.get(playerId) ?? null;
  }

  saveCollectionCounts(playerId: string, counts: Map<string, number>): void {
    this.collections.set(playerId, new Map(counts));
  }

  getDeck(playerId: string): IDeck | null {
    const deck = this.decks.get(playerId);
    if (!deck) return null;
    return {
      playerId: deck.playerId,
      slots: deck.slots.map((slot) => ({ ...slot })),
      fusionSlots: (deck.fusionSlots ?? []).map((slot) => ({ ...slot })),
    };
  }

  saveDeck(deck: IDeck): void {
    this.decks.set(deck.playerId, {
      playerId: deck.playerId,
      slots: deck.slots.map((slot) => ({ ...slot })),
      fusionSlots: (deck.fusionSlots ?? []).map((slot) => ({ ...slot })),
    });
  }

  appendTransaction(transaction: IMarketTransaction): void {
    this.transactions.push({ ...transaction, purchasedCardIds: [...transaction.purchasedCardIds] });
  }

  getTransactions(playerId: string): IMarketTransaction[] {
    return this.transactions
      .filter((transaction) => transaction.playerId === playerId)
      .map((transaction) => ({ ...transaction, purchasedCardIds: [...transaction.purchasedCardIds] }));
  }
}
