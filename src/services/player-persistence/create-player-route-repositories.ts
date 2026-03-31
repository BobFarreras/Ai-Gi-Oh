// src/services/player-persistence/create-player-route-repositories.ts - Construye repositorios persistentes para endpoints HTTP con cookies de sesión.
import { NextRequest, NextResponse } from "next/server";
import { SupabaseCardCollectionRepository } from "@/infrastructure/persistence/supabase/SupabaseCardCollectionRepository";
import { SupabaseDeckRepository } from "@/infrastructure/persistence/supabase/SupabaseDeckRepository";
import { SupabaseMarketRepository } from "@/infrastructure/persistence/supabase/SupabaseMarketRepository";
import { SupabasePlayerBattleExperienceBatchRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerBattleExperienceBatchRepository";
import { SupabasePlayerCardProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerCardProgressRepository";
import { SupabaseTrainingMatchClaimRepository } from "@/infrastructure/persistence/supabase/SupabaseTrainingMatchClaimRepository";
import { SupabaseTrainingProgressRepository } from "@/infrastructure/persistence/supabase/SupabaseTrainingProgressRepository";
import { SupabaseTransactionRepository } from "@/infrastructure/persistence/supabase/SupabaseTransactionRepository";
import { SupabaseWalletRepository } from "@/infrastructure/persistence/supabase/SupabaseWalletRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { InMemoryMarketRepository } from "@/infrastructure/repositories/InMemoryMarketRepository";
import { canUseSupabaseMarketCatalog } from "@/services/player-persistence/internal/can-use-supabase-market-catalog";

export async function createPlayerRouteRepositories(request: NextRequest, response: NextResponse) {
  const client = createSupabaseRouteClient(request, response);
  const marketRepository = (await canUseSupabaseMarketCatalog(client))
    ? new SupabaseMarketRepository(client)
    : new InMemoryMarketRepository();
  const collectionRepository = new SupabaseCardCollectionRepository(client);
  const walletRepository = new SupabaseWalletRepository(client);
  const transactionRepository = new SupabaseTransactionRepository(client);
  const deckRepository = new SupabaseDeckRepository(client, collectionRepository);
  const playerCardProgressRepository = new SupabasePlayerCardProgressRepository(client);
  const playerBattleExperienceBatchRepository = new SupabasePlayerBattleExperienceBatchRepository(client);
  const trainingProgressRepository = new SupabaseTrainingProgressRepository(client);
  const trainingMatchClaimRepository = new SupabaseTrainingMatchClaimRepository(client);
  return {
    client,
    marketRepository,
    walletRepository,
    collectionRepository,
    transactionRepository,
    deckRepository,
    playerCardProgressRepository,
    playerBattleExperienceBatchRepository,
    trainingProgressRepository,
    trainingMatchClaimRepository,
  };
}
