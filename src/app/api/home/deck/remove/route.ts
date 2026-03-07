// src/app/api/home/deck/remove/route.ts - Elimina carta del slot del deck autenticado y devuelve el resultado.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";

interface IRemoveCardPayload {
  slotIndex: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as IRemoveCardPayload;
    const context = await createHomeRouteContext(request);
    const deck = await context.removeCardUseCase.execute({ playerId: context.playerId, slotIndex: payload.slotIndex });
    return NextResponse.json(deck, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof GameRuleError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo retirar la carta del deck. Inténtalo de nuevo." }, { status: 400 });
  }
}
