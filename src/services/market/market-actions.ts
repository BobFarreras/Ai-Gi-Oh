// src/services/market/market-actions.ts - Acciones de mercado para UI reutilizando casos de uso y repositorios mock compartidos.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { IMarketRuntimeSnapshot } from "@/services/market/market-runtime-snapshot";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | { message?: string };
  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? data.message : undefined;
    throw new Error(message ?? "No se pudo completar la acción de mercado.");
  }
  return data as T;
}

export async function getMarketCatalogAction(playerId: string): Promise<IMarketCatalog> {
  void playerId;
  const response = await fetch("/api/market/catalog", { method: "GET", cache: "no-store" });
  return parseJsonResponse<IMarketCatalog>(response);
}

export async function getMarketTransactionsAction(playerId: string): Promise<IMarketTransaction[]> {
  void playerId;
  const response = await fetch("/api/market/transactions", { method: "GET", cache: "no-store" });
  return parseJsonResponse<IMarketTransaction[]>(response);
}

export async function getPlayerCollectionAction(playerId: string): Promise<ICollectionCard[]> {
  void playerId;
  const response = await fetch("/api/market/collection", { method: "GET", cache: "no-store" });
  return parseJsonResponse<ICollectionCard[]>(response);
}

export async function buyMarketCardAction(playerId: string, listingId: string): Promise<IMarketRuntimeSnapshot> {
  void playerId;
  const response = await fetch("/api/market/buy-card", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ listingId }),
    cache: "no-store",
  });
  return parseJsonResponse<IMarketRuntimeSnapshot>(response);
}

export async function buyPackAction(
  playerId: string,
  packId: string,
): Promise<IMarketRuntimeSnapshot & { openedCardIds: string[] }> {
  void playerId;
  const response = await fetch("/api/market/buy-pack", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ packId }),
    cache: "no-store",
  });
  return parseJsonResponse<IMarketRuntimeSnapshot & { openedCardIds: string[] }>(response);
}
