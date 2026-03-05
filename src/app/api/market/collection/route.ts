// src/app/api/market/collection/route.ts - Devuelve colección de cartas del jugador autenticado para panel de almacén.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { createMarketRouteContext } from "@/app/api/market/internal/create-market-route-context";

export async function GET(request: NextRequest) {
  try {
    const context = await createMarketRouteContext(request);
    const collection = await context.repositories.collectionRepository.getCollection(context.playerId);
    return NextResponse.json(collection, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "No se pudo cargar el almacén del mercado." }, { status: 400 });
  }
}
