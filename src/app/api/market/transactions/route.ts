// src/app/api/market/transactions/route.ts - Devuelve historial de transacciones del mercado para el jugador autenticado.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { createMarketRouteContext } from "@/app/api/market/internal/create-market-route-context";

export async function GET(request: NextRequest) {
  try {
    const context = await createMarketRouteContext(request);
    const transactions = await context.getTransactionsUseCase.execute(context.playerId);
    return NextResponse.json(transactions, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "No se pudo cargar el historial del mercado." }, { status: 400 });
  }
}
