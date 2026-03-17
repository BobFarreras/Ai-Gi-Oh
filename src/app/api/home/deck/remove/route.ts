// src/app/api/home/deck/remove/route.ts - Elimina carta del slot del deck autenticado y devuelve el resultado.
import { NextRequest, NextResponse } from "next/server";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import {
  readJsonObjectBody,
  readRequiredIntegerField,
} from "@/services/security/api/request-body-parser";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const payload = await readJsonObjectBody(request, "Payload inválido para retirar carta del deck.");
    const slotIndex = readRequiredIntegerField(payload, "slotIndex", "El slotIndex debe ser un entero válido.");
    const context = await createHomeRouteContext(request);
    const deck = await context.removeCardUseCase.execute({ playerId: context.playerId, slotIndex });
    return NextResponse.json(deck, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo retirar la carta del deck. Inténtalo de nuevo.");
  }
}
