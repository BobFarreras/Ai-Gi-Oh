// src/app/api/market/catalog/route.ts - Devuelve catálogo del mercado para el jugador autenticado.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { createMarketRouteContext } from "@/app/api/market/internal/create-market-route-context";

export async function GET(request: NextRequest) {
  try {
    const context = await createMarketRouteContext(request);
    const catalog = await context.getCatalogUseCase.execute(context.playerId);
    return NextResponse.json(catalog, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "No se pudo cargar el catálogo de mercado." }, { status: 400 });
  }
}
