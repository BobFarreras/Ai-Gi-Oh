// src/core/use-cases/market/GetMarketCatalogUseCase.test.ts - Verifica lectura inicial de catálogo y saldo Nexus del mercado.
import { describe, expect, it } from "vitest";
import { InMemoryMarketRepository } from "@/infrastructure/repositories/InMemoryMarketRepository";
import { InMemoryWalletRepository } from "@/infrastructure/repositories/InMemoryWalletRepository";
import { GetMarketCatalogUseCase } from "./GetMarketCatalogUseCase";

describe("GetMarketCatalogUseCase", () => {
  it("devuelve saldo, cartas y sobres disponibles", async () => {
    const marketRepository = new InMemoryMarketRepository();
    const walletRepository = new InMemoryWalletRepository([{ playerId: "player-a", nexus: 750 }]);
    const useCase = new GetMarketCatalogUseCase(marketRepository, walletRepository);

    const catalog = await useCase.execute("player-a");
    expect(catalog.wallet.nexus).toBe(750);
    expect(catalog.listings.length).toBeGreaterThan(0);
    expect(catalog.packs.length).toBeGreaterThan(0);
  });
});
