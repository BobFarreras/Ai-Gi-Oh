// src/app/api/home/deck/save/route.ts - Valida y guarda el deck completo del jugador autenticado.
import { NextRequest, NextResponse } from "next/server";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createHomeRouteContext(request);
    const deck = await context.saveDeckUseCase.execute(context.playerId);
    return NextResponse.json(deck, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar el deck del jugador. Revisa su configuración.");
  }
}
