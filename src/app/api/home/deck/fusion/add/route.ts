// src/app/api/home/deck/fusion/add/route.ts - Inserta una carta de fusión en un slot dedicado del Arsenal y devuelve el deck actualizado.
import { NextRequest, NextResponse } from "next/server";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { ValidationError } from "@/core/errors/ValidationError";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";

interface IAddFusionCardPayload {
  cardId: string;
  slotIndex: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as IAddFusionCardPayload;
    const context = await createHomeRouteContext(request);
    const deck = await context.addFusionCardUseCase.execute({
      playerId: context.playerId,
      cardId: payload.cardId,
      slotIndex: payload.slotIndex,
    });
    return NextResponse.json(deck, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof GameRuleError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo equipar la carta de fusión." }, { status: 400 });
  }
}
