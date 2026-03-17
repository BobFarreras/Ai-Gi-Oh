// src/app/api/home/deck/fusion/add/route.ts - Inserta una carta de fusión en un slot dedicado del Arsenal y devuelve el deck actualizado.
import { NextRequest, NextResponse } from "next/server";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import {
  readJsonObjectBody,
  readRequiredIntegerField,
  readRequiredStringField,
} from "@/services/security/api/request-body-parser";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const payload = await readJsonObjectBody(request, "Payload inválido para añadir carta de fusión.");
    const cardId = readRequiredStringField(payload, "cardId", "El identificador de carta es obligatorio.");
    const slotIndex = readRequiredIntegerField(payload, "slotIndex", "El slotIndex debe ser un entero válido.");
    const context = await createHomeRouteContext(request);
    const deck = await context.addFusionCardUseCase.execute({
      playerId: context.playerId,
      cardId,
      slotIndex,
    });
    return NextResponse.json(deck, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo equipar la carta de fusión.");
  }
}
