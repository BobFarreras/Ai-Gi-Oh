// src/app/api/market/buy-card/route.ts - Ejecuta compra de carta individual y devuelve catálogo actualizado.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { createMarketRouteContext } from "@/app/api/market/internal/create-market-route-context";
import { IMarketRuntimeSnapshot } from "@/services/market/market-runtime-snapshot";

interface IBuyCardPayload {
  listingId: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as IBuyCardPayload;
    const context = await createMarketRouteContext(request);
    await context.buyCardUseCase.execute({ playerId: context.playerId, listingId: payload.listingId });
    const [catalog, transactions, collection] = await Promise.all([
      context.getCatalogUseCase.execute(context.playerId),
      context.getTransactionsUseCase.execute(context.playerId),
      context.repositories.collectionRepository.getCollection(context.playerId),
    ]);
    const snapshot: IMarketRuntimeSnapshot = { catalog, transactions, collection };
    return NextResponse.json(snapshot, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof GameRuleError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "No se pudo completar la compra de carta. Revisa saldo Nexus, stock y disponibilidad." },
      { status: 400 },
    );
  }
}
