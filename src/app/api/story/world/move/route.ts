// src/app/api/story/world/move/route.ts - Mueve el cursor del mapa Story entre nodos desbloqueados y conectados.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { GetStoryWorldStateUseCase } from "@/core/use-cases/story/GetStoryWorldStateUseCase";
import { assertValidStoryNodeId } from "@/core/use-cases/story/internal/assert-valid-story-node-id";
import { SupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentRepository";
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";
import { SupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { resolveStoryWorldMoveMode } from "@/services/story/resolve-story-world-move-mode";
import { resolveStoryWorldTraversalPath } from "@/services/story/resolve-story-world-traversal-path";
import { applyStoryTraversalToCompactState } from "@/services/story/story-compact-state";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";

function resolveEffectiveCurrentNodeId(currentNodeId: string | null): string {
  return currentNodeId ?? "story-ch1-player-start";
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = await readJsonObjectBody(request, "Payload inválido para movimiento Story.");
    const nodeId = readRequiredStringField(payload, "nodeId", "Nodo destino inválido.");
    assertValidStoryNodeId(nodeId);
    const opponentRepository = new SupabaseOpponentRepository(repositories.client);
    const duelProgressRepository = new SupabasePlayerStoryDuelProgressRepository(repositories.client);
    const worldRepository = new SupabasePlayerStoryWorldRepository(repositories.client);
    const worldStateUseCase = new GetStoryWorldStateUseCase(opponentRepository, duelProgressRepository);
    const worldState = await worldStateUseCase.execute({ playerId });
    const compactState = await worldRepository.getCompactStateByPlayerId(playerId);
    const effectiveCurrentNodeId = resolveEffectiveCurrentNodeId(compactState.currentNodeId);
    if (nodeId === effectiveCurrentNodeId) {
      return NextResponse.json(
        {
          currentNodeId: effectiveCurrentNodeId,
          pathNodeIds: [],
        },
        { status: 200, headers: response.headers },
      );
    }
    const moveMode = resolveStoryWorldMoveMode({
      targetNodeId: nodeId,
      currentNodeId: effectiveCurrentNodeId,
      visitedNodeIds: compactState.visitedNodeIds,
      completedNodeIds: worldState.progress.completedNodeIds,
      interactedNodeIds: compactState.interactedNodeIds,
    });
    if (!moveMode.isAllowed) {
      throw new ValidationError(moveMode.validationMessage ?? "Movimiento Story inválido.");
    }
    const traversalPath = resolveStoryWorldTraversalPath({
      currentNodeId: effectiveCurrentNodeId,
      targetNodeId: nodeId,
      visitedNodeIds: compactState.visitedNodeIds,
      completedNodeIds: worldState.progress.completedNodeIds,
      interactedNodeIds: compactState.interactedNodeIds,
    });
    if (!traversalPath || traversalPath.length === 0) {
      throw new ValidationError("No se pudo resolver una ruta de movimiento válida.");
    }
    const traversedNodeIds = traversalPath.slice(1);
    const nextCompactState = applyStoryTraversalToCompactState({
      state: compactState,
      fromNodeId: effectiveCurrentNodeId,
      traversedNodeIds,
    });
    await worldRepository.saveCompactStateByPlayerId(playerId, nextCompactState);
    return NextResponse.json(
      {
        currentNodeId: nextCompactState.currentNodeId,
        pathNodeIds: traversedNodeIds,
      },
      { status: 200, headers: response.headers },
    );
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo mover el cursor Story.");
  }
}
