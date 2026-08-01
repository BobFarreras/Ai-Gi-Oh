// src/app/api/olympus/battles/complete/route.ts - Reproduce y liquida un combate de Olimpo sin confiar en el cliente.
import { NextRequest, NextResponse } from "next/server";
import { CompleteOlympusBattleUseCase } from "@/core/use-cases/olympus/CompleteOlympusBattleUseCase";
import { ValidationError } from "@/core/errors/ValidationError";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { parseCombatProof } from "@/services/security/api/parse-combat-proof";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { enforcePveRateLimit } from "@/services/security/api/rate-limit/enforce-pve-rate-limit";
import { verifyCombatSessionTicket } from "@/services/security/duel-completion-ticket";
import { createOlympusRouteContext } from "@/services/olympus/create-olympus-route-context";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createOlympusRouteContext(request);
    const rateLimited = await enforcePveRateLimit(request, context.playerId, {
      // Recibe el avance de cada turno, no solo el cierre: el cupo cubre varios combates largos seguidos.
      mode: "olympus", operation: "complete", maxPerPlayer: 400, maxPerIp: 800, windowMs: 5 * 60 * 1000,
    }, context.response.headers);
    if (rateLimited) return rateLimited;
    const body = await readJsonObjectBody(request, "Payload inválido para completar combate.");
    const ticket = readRequiredStringField(body, "completionTicket", "Falta el ticket de combate.");
    const proof = parseCombatProof(body.proof);
    const claims = verifyCombatSessionTicket(ticket, context.playerId, "OLYMPUS");
    if (
      claims.sessionId !== proof.sessionId
      || claims.battleId !== proof.battleId
      || claims.snapshotHash !== proof.snapshotHash
      || claims.protocolVersion !== proof.protocolVersion
    ) {
      throw new ValidationError("La prueba no coincide con el ticket firmado.");
    }
    const result = await new CompleteOlympusBattleUseCase(context.repository)
      .execute(context.playerId, proof);
    return NextResponse.json(result, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo completar el combate de Olimpo.");
  }
}
