// src/services/player-persistence/create-player-route-repositories.ts - Construye repositorios persistentes para endpoints HTTP con cookies de sesión.
import { NextRequest, NextResponse } from "next/server";
import { SupabaseCardCollectionRepository } from "@/infrastructure/persistence/supabase/SupabaseCardCollectionRepository";
import { SupabaseDeckRepository } from "@/infrastructure/persistence/supabase/SupabaseDeckRepository";
import { SupabaseTransactionRepository } from "@/infrastructure/persistence/supabase/SupabaseTransactionRepository";
import { SupabaseWalletRepository } from "@/infrastructure/persistence/supabase/SupabaseWalletRepository";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { InMemoryMarketRepository } from "@/infrastructure/repositories/InMemoryMarketRepository";

export function createPlayerRouteRepositories(request: NextRequest, response: NextResponse) {
  const client = createSupabaseRouteClient(request, response);
  const marketRepository = new InMemoryMarketRepository();
  const collectionRepository = new SupabaseCardCollectionRepository(client);
  const walletRepository = new SupabaseWalletRepository(client);
  const transactionRepository = new SupabaseTransactionRepository(client);
  const deckRepository = new SupabaseDeckRepository(client, collectionRepository);
  return { client, marketRepository, walletRepository, collectionRepository, transactionRepository, deckRepository };
}
