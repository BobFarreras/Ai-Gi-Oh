// src/app/api/home/deck/save/route.ts - Valida y guarda el deck completo del jugador autenticado.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";

export async function POST(request: NextRequest) {
  try {
    const context = await createHomeRouteContext(request);
    const deck = await context.saveDeckUseCase.execute(context.playerId);
    return NextResponse.json(deck, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo guardar el deck del jugador." }, { status: 400 });
  }
}
