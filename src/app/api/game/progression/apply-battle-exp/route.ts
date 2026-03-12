// src/app/api/game/progression/apply-battle-exp/route.ts - Persiste en batch la EXP de cartas de un duelo para el jugador autenticado.
import { NextRequest, NextResponse } from "next/server";
import { ApplyBattleCardExperienceUseCase } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";
import { ICardExperienceEvent } from "@/core/services/progression/card-experience-rules";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import {
  readJsonObjectBody,
  readRequiredArrayField,
  readRequiredStringField,
} from "@/services/security/api/request-body-parser";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = await readJsonObjectBody(request, "Payload inválido para guardar experiencia de batalla.");
    const battleId = readRequiredStringField(payload, "battleId", "El battleId es obligatorio para idempotencia de experiencia.");
    const events = readRequiredArrayField<ICardExperienceEvent>(
      payload,
      "events",
      "El listado de eventos de experiencia es obligatorio.",
    );
    let reservedBatch = true;
    try {
      reservedBatch = await repositories.playerBattleExperienceBatchRepository.tryReserveBatch(
        playerId,
        battleId,
        events.length,
      );
    } catch {
      reservedBatch = true;
    }
    if (!reservedBatch) return NextResponse.json([], { status: 200, headers: response.headers });
    const useCase = new ApplyBattleCardExperienceUseCase(repositories.playerCardProgressRepository);
    const result = await useCase.execute({ playerId, events });
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la experiencia de cartas del duelo.");
  }
}
