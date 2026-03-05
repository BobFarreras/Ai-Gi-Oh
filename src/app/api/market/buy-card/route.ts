// src/app/api/market/buy-card/route.ts - Ejecuta compra de carta individual y devuelve catálogo actualizado.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { createMarketRouteContext } from "@/app/api/market/internal/create-market-route-context";

interface IBuyCardPayload {
  listingId: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as IBuyCardPayload;
    const context = await createMarketRouteContext(request);
    await context.buyCardUseCase.execute({ playerId: context.playerId, listingId: payload.listingId });
    const catalog = await context.getCatalogUseCase.execute(context.playerId);
    return NextResponse.json(catalog, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo completar la compra de carta." }, { status: 400 });
  }
}
