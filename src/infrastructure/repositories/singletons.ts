// src/infrastructure/repositories/singletons.ts - Instancias in-memory compartidas entre módulos Hub para estado mock persistente.
import { InMemoryCardCollectionRepository } from "@/infrastructure/repositories/InMemoryCardCollectionRepository";
import { InMemoryDeckRepository } from "@/infrastructure/repositories/InMemoryDeckRepository";
import { InMemoryMarketRepository } from "@/infrastructure/repositories/InMemoryMarketRepository";
import { InMemoryTransactionRepository } from "@/infrastructure/repositories/InMemoryTransactionRepository";
import { InMemoryWalletRepository } from "@/infrastructure/repositories/InMemoryWalletRepository";

export const sharedCollectionRepository = new InMemoryCardCollectionRepository("local-player");
export const sharedWalletRepository = new InMemoryWalletRepository([{ playerId: "local-player", nexus: 1500 }]);
export const sharedMarketRepository = new InMemoryMarketRepository();
export const sharedTransactionRepository = new InMemoryTransactionRepository();
export const sharedDeckRepository = new InMemoryDeckRepository(undefined, [], sharedCollectionRepository);
