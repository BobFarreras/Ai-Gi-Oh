// src/services/player-persistence/create-player-runtime-repositories.ts - Construye repositorios persistentes de Home/Market para server components.
import { SupabaseCardCollectionRepository } from "@/infrastructure/persistence/supabase/SupabaseCardCollectionRepository";
import { SupabaseDeckRepository } from "@/infrastructure/persistence/supabase/SupabaseDeckRepository";
import { SupabaseMarketRepository } from "@/infrastructure/persistence/supabase/SupabaseMarketRepository";
import { SupabasePlayerCardProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerCardProgressRepository";
import { SupabaseTransactionRepository } from "@/infrastructure/persistence/supabase/SupabaseTransactionRepository";
import { SupabaseWalletRepository } from "@/infrastructure/persistence/supabase/SupabaseWalletRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export interface IPlayerRuntimeRepositories {
  marketRepository: SupabaseMarketRepository;
  walletRepository: SupabaseWalletRepository;
  collectionRepository: SupabaseCardCollectionRepository;
  transactionRepository: SupabaseTransactionRepository;
  deckRepository: SupabaseDeckRepository;
  playerCardProgressRepository: SupabasePlayerCardProgressRepository;
}

export async function createPlayerRuntimeRepositories(): Promise<IPlayerRuntimeRepositories> {
  const client = await createSupabaseServerClient();
  // El mercado siempre se sirve desde la BD (estructura + seed garantizados por el bootstrap).
  const marketRepository = new SupabaseMarketRepository(client);
  const collectionRepository = new SupabaseCardCollectionRepository(client);
  const walletRepository = new SupabaseWalletRepository(client);
  const transactionRepository = new SupabaseTransactionRepository(client);
  const deckRepository = new SupabaseDeckRepository(client, collectionRepository);
  const playerCardProgressRepository = new SupabasePlayerCardProgressRepository(client);
  return { marketRepository, walletRepository, collectionRepository, transactionRepository, deckRepository, playerCardProgressRepository };
}
