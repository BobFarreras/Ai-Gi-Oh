// src/infrastructure/repositories/singletons.ts - Instancias in-memory compartidas entre módulos Hub para estado mock persistente.
import { InMemoryCardCollectionRepository } from "@/infrastructure/repositories/InMemoryCardCollectionRepository";
import { InMemoryDeckRepository } from "@/infrastructure/repositories/InMemoryDeckRepository";
import { InMemoryMarketRepository } from "@/infrastructure/repositories/InMemoryMarketRepository";
import { InMemoryTransactionRepository } from "@/infrastructure/repositories/InMemoryTransactionRepository";
import { InMemoryWalletRepository } from "@/infrastructure/repositories/InMemoryWalletRepository";
import { InMemoryPlayerPersistenceStore } from "@/infrastructure/repositories/state/InMemoryPlayerPersistenceStore";

const sharedPlayerStore = new InMemoryPlayerPersistenceStore();

export const sharedCollectionRepository = new InMemoryCardCollectionRepository("local-player", sharedPlayerStore);
export const sharedWalletRepository = new InMemoryWalletRepository(
  [{ playerId: "local-player", nexus: 1500 }],
  sharedPlayerStore,
);
export const sharedMarketRepository = new InMemoryMarketRepository();
export const sharedTransactionRepository = new InMemoryTransactionRepository(sharedPlayerStore);
export const sharedDeckRepository = new InMemoryDeckRepository(undefined, [], sharedCollectionRepository, sharedPlayerStore);
