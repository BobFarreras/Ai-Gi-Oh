// src/infrastructure/repositories/state/IPlayerPersistenceStore.ts - Contrato de almacenamiento persistible para estado del jugador en módulos Hub.
import { IDeck } from "@/core/entities/home/IDeck";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IPlayerWallet } from "@/core/entities/market/IPlayerWallet";

export interface IPlayerPersistenceStore {
  getWallet(playerId: string): IPlayerWallet | null;
  saveWallet(wallet: IPlayerWallet): void;
  getCollectionCounts(playerId: string): Map<string, number> | null;
  saveCollectionCounts(playerId: string, counts: Map<string, number>): void;
  getDeck(playerId: string): IDeck | null;
  saveDeck(deck: IDeck): void;
  appendTransaction(transaction: IMarketTransaction): void;
  getTransactions(playerId: string): IMarketTransaction[];
}
