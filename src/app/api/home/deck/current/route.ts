// src/app/api/home/deck/current/route.ts - Devuelve el deck actual persistido para reconciliar estado cliente tras mutaciones optimistas.
import { NextRequest, NextResponse } from "next/server";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";

export async function GET(request: NextRequest) {
  try {
    const context = await createHomeRouteContext(request);
    // Slot-aware: con ?slot=SECONDARY devuelve el 2º mazo (banco); si no, el activo.
    const deck = await context.deckRepository.getDeck(context.playerId);
    return NextResponse.json(deck, { status: 200, headers: context.response.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el deck actual.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
