// src/app/api/tutorial/nodes/complete/route.ts - Endpoint para registrar completion de nodos tutorial por jugador autenticado.
import { NextRequest, NextResponse } from "next/server";
import { SupabaseTutorialNodeProgressRepository } from "@/infrastructure/persistence/supabase/SupabaseTutorialNodeProgressRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { processTutorialNodeCompletion } from "./internal/process-tutorial-node-completion";

interface INodeCompletionPayload {
  nodeId?: unknown;
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = await readJsonObjectBody(request, "Payload inválido para completar nodo del tutorial.") as INodeCompletionPayload;
    const nodeId = typeof payload.nodeId === "string" ? payload.nodeId : "";
    const result = await processTutorialNodeCompletion({
      playerId,
      nodeId,
      nodeProgressRepository: new SupabaseTutorialNodeProgressRepository(repositories.client),
    });
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo completar el nodo tutorial.");
  }
}
