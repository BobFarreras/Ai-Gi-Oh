// src/app/api/home/deck/add/route.ts - Añade carta al deck del jugador autenticado y devuelve estado actualizado.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";

interface IAddCardPayload {
  cardId: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as IAddCardPayload;
    const context = await createHomeRouteContext(request);
    const deck = await context.addCardUseCase.execute({ playerId: context.playerId, cardId: payload.cardId });
    return NextResponse.json(deck, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof GameRuleError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { message: "No se pudo añadir la carta al deck. Revisa si tienes espacio libre y copias disponibles." },
      { status: 400 },
    );
  }
}
