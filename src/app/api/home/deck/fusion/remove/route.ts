// src/app/api/home/deck/fusion/remove/route.ts - Vacía un slot del bloque de fusión del Arsenal.
import { NextRequest, NextResponse } from "next/server";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { ValidationError } from "@/core/errors/ValidationError";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";

interface IRemoveFusionCardPayload {
  slotIndex: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as IRemoveFusionCardPayload;
    const context = await createHomeRouteContext(request);
    const deck = await context.removeFusionCardUseCase.execute({
      playerId: context.playerId,
      slotIndex: payload.slotIndex,
    });
    return NextResponse.json(deck, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof GameRuleError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo retirar la carta del bloque de fusión." }, { status: 400 });
  }
}
