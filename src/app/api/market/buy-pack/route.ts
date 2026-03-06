// src/app/api/market/buy-pack/route.ts - Ejecuta compra de sobre y devuelve cartas abiertas junto al catálogo actualizado.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { createMarketRouteContext } from "@/app/api/market/internal/create-market-route-context";
import { IMarketRuntimeSnapshot } from "@/services/market/market-runtime-snapshot";

interface IBuyPackPayload {
  packId: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as IBuyPackPayload;
    const context = await createMarketRouteContext(request);
    const openedCardIds = await context.buyPackUseCase.execute({ playerId: context.playerId, packId: payload.packId });
    const [catalog, transactions, collection] = await Promise.all([
      context.getCatalogUseCase.execute(context.playerId),
      context.getTransactionsUseCase.execute(context.playerId),
      context.repositories.collectionRepository.getCollection(context.playerId),
    ]);
    const snapshot: IMarketRuntimeSnapshot = { catalog, transactions, collection };
    return NextResponse.json({ ...snapshot, openedCardIds }, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo completar la compra del sobre." }, { status: 400 });
  }
}
