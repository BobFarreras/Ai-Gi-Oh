// src/app/api/home/collection/evolve/route.ts - Evoluciona versión de carta desde copias en almacén y devuelve snapshot actualizado.
import { NextRequest, NextResponse } from "next/server";
import { createHomeRouteContext } from "@/app/api/home/internal/create-home-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const payload = await readJsonObjectBody(request, "Payload inválido para evolucionar carta.");
    const cardId = readRequiredStringField(payload, "cardId", "El identificador de carta es obligatorio.");
    const context = await createHomeRouteContext(request);
    const evolveResult = await context.evolveCardVersionUseCase.execute({
      playerId: context.playerId,
      cardId,
    });
    return NextResponse.json(evolveResult, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo evolucionar la carta.");
  }
}
