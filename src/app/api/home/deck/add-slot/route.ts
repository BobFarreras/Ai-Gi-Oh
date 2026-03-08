// src/app/api/home/deck/add-slot/route.ts - Añade una carta del almacén a un slot concreto del deck principal.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";

interface IAddCardToDeckSlotPayload {
  cardId: string;
  slotIndex: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as IAddCardToDeckSlotPayload;
    const context = await createHomeRouteContext(request);
    const deck = await context.addCardUseCase.execute({
      playerId: context.playerId,
      cardId: payload.cardId,
      slotIndex: payload.slotIndex,
    });
    return NextResponse.json(deck, { status: 200, headers: context.response.headers });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof GameRuleError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo colocar la carta en el slot seleccionado." }, { status: 400 });
  }
}
