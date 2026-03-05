// src/app/api/market/internal/create-market-route-context.ts - Crea contexto autenticado para endpoints del mercado con repositorios persistentes.
import { NextRequest, NextResponse } from "next/server";
import { GetMarketCatalogUseCase } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { GetMarketTransactionsUseCase } from "@/core/use-cases/market/GetMarketTransactionsUseCase";
import { BuyMarketCardUseCase } from "@/core/use-cases/market/BuyMarketCardUseCase";
import { BuyPackUseCase } from "@/core/use-cases/market/BuyPackUseCase";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";

export async function createMarketRouteContext(request: NextRequest) {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  const repositories = await createPlayerRouteRepositories(request, response);
  const playerId = await getAuthenticatedUserId(repositories.client);
  return {
    response,
    playerId,
    repositories,
    getCatalogUseCase: new GetMarketCatalogUseCase(repositories.marketRepository, repositories.walletRepository),
    getTransactionsUseCase: new GetMarketTransactionsUseCase(repositories.transactionRepository),
    buyCardUseCase: new BuyMarketCardUseCase(
      repositories.marketRepository,
      repositories.walletRepository,
      repositories.collectionRepository,
      repositories.transactionRepository,
    ),
    buyPackUseCase: new BuyPackUseCase(
      repositories.marketRepository,
      repositories.walletRepository,
      repositories.collectionRepository,
      repositories.transactionRepository,
    ),
  };
}
