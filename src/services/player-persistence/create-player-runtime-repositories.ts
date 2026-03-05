// src/services/player-persistence/create-player-runtime-repositories.ts - Construye repositorios persistentes de Home/Market para server components.
import { SupabaseCardCollectionRepository } from "@/infrastructure/persistence/supabase/SupabaseCardCollectionRepository";
import { SupabaseDeckRepository } from "@/infrastructure/persistence/supabase/SupabaseDeckRepository";
import { SupabaseTransactionRepository } from "@/infrastructure/persistence/supabase/SupabaseTransactionRepository";
import { SupabaseWalletRepository } from "@/infrastructure/persistence/supabase/SupabaseWalletRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { InMemoryMarketRepository } from "@/infrastructure/repositories/InMemoryMarketRepository";

export interface IPlayerRuntimeRepositories {
  marketRepository: InMemoryMarketRepository;
  walletRepository: SupabaseWalletRepository;
  collectionRepository: SupabaseCardCollectionRepository;
  transactionRepository: SupabaseTransactionRepository;
  deckRepository: SupabaseDeckRepository;
}

export async function createPlayerRuntimeRepositories(): Promise<IPlayerRuntimeRepositories> {
  const client = await createSupabaseServerClient();
  const marketRepository = new InMemoryMarketRepository();
  const collectionRepository = new SupabaseCardCollectionRepository(client);
  const walletRepository = new SupabaseWalletRepository(client);
  const transactionRepository = new SupabaseTransactionRepository(client);
  const deckRepository = new SupabaseDeckRepository(client, collectionRepository);
  return { marketRepository, walletRepository, collectionRepository, transactionRepository, deckRepository };
}
