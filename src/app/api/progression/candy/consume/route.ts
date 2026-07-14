// src/app/api/progression/candy/consume/route.ts - Consume un USB Raro sobre una carta del jugador.
// Server-authoritative: del cliente solo llegan el caramelo, la carta y la clave de operación; la XP la calcula
// el servidor con la curva y la escritura es una transacción SQL idempotente que valida la posesión.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { consumeLevelCandy } from "@/services/progression/consume-level-candy";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const payload = await readJsonObjectBody(request, "Payload inválido.");
    const result = await consumeLevelCandy({
      candyId: typeof payload.candyId === "string" ? payload.candyId : "",
      cardId: typeof payload.cardId === "string" ? payload.cardId : "",
      operationId: typeof payload.operationId === "string" ? payload.operationId : "",
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo usar el caramelo.");
  }
}
