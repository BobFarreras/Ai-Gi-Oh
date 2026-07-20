// src/app/api/progression/skill-tree/respec/route.ts - Reasigna (resetea) el árbol de habilidades del jugador
// (ficha 8, modelo A: gratis con llave). La RPC service-role valida que el jugador tiene la llave
// (GRANT_RESPEC_TOKEN) y borra sus rangos de forma atómica e idempotente. El cliente solo aporta el operationId.
import { NextRequest, NextResponse } from "next/server";
import { SupabaseSkillTreeRepository } from "@/infrastructure/persistence/supabase/SupabaseSkillTreeRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { RespecSkillTreeUseCase } from "@/core/use-cases/progression/RespecSkillTreeUseCase";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = await readJsonObjectBody(request, "Payload inválido para reasignar el árbol.");
    // operationId estable por clic (uuid) → los reintentos de red no re-borran nada (idempotencia).
    const operationId = readRequiredStringField(payload, "operationId", "La operación de reasignación es obligatoria.");
    const result = await new RespecSkillTreeUseCase(
      new SupabaseSkillTreeRepository(repositories.client),
    ).execute({ playerId, operationId });
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo reasignar el árbol de habilidades.");
  }
}
