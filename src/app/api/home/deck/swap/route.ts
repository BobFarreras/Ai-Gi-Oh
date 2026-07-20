// src/app/api/home/deck/swap/route.ts - Doble Arsenal (ficha 8): intercambia el mazo activo con el 2º mazo
// (banco). La RPC service-role valida la llave (nodo UNLOCK_SECOND_DECK) y aplica el swap atómico e idempotente.
// El cliente solo aporta un operationId estable por clic (los reintentos de red no re-intercambian).
import { NextRequest, NextResponse } from "next/server";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const payload = await readJsonObjectBody(request, "Payload inválido para cambiar el mazo activo.");
    const operationId = readRequiredStringField(payload, "operationId", "La operación de cambio de mazo es obligatoria.");
    const context = await createHomeRouteContext(request);
    const result = await context.swapActiveDeckUseCase.execute({ playerId: context.playerId, operationId });
    return NextResponse.json(result, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo cambiar el mazo activo.");
  }
}
