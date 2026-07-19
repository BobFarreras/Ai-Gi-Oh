// src/app/api/progression/skill-tree/rank-up/route.ts - Sube un rango de un nodo del árbol de habilidades
// (ficha 8). El use-case deriva los puntos disponibles de la XP server-authoritative; la RPC service-role valida
// gate-por-rango, tope y puntos de forma atómica e idempotente. El cliente no aporta puntos.
import { NextRequest, NextResponse } from "next/server";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { SupabaseSkillTreeRepository } from "@/infrastructure/persistence/supabase/SupabaseSkillTreeRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { RankUpSkillNodeUseCase } from "@/core/use-cases/progression/RankUpSkillNodeUseCase";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = await readJsonObjectBody(request, "Payload inválido para subir rango del árbol.");
    const nodeId = readRequiredStringField(payload, "nodeId", "El identificador del nodo es obligatorio.");
    // El cliente aporta un operationId estable por clic (uuid) → los reintentos de red no doblan el rango.
    const operationId = readRequiredStringField(payload, "operationId", "La operación de subida es obligatoria.");
    const result = await new RankUpSkillNodeUseCase(
      new SupabaseSkillTreeRepository(repositories.client),
      new SupabasePlayerProgressRepository(repositories.client),
    ).execute({ playerId, nodeId, operationId });
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo subir el rango de la habilidad.");
  }
}
