// src/app/api/story/world/interact/route.ts - Registra interacciones narrativas de nodos Story virtuales y devuelve historial actualizado.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { GetStoryWorldStateUseCase } from "@/core/use-cases/story/GetStoryWorldStateUseCase";
import { assertValidStoryNodeId } from "@/core/use-cases/story/internal/assert-valid-story-node-id";
import { SupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentRepository";
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";
import { SupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { findStoryVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-registry";
import { applyStoryInteractionToCompactState } from "@/services/story/story-compact-state";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";

function canInteractVirtualNode(input: {
  requiredNodeId: string | null;
  completedNodeIds: string[];
  interactedNodeIds: string[];
}): boolean {
  if (!input.requiredNodeId) return true;
  const requiredVirtualNode = findStoryVirtualNodeDefinition(input.requiredNodeId);
  if (requiredVirtualNode?.nodeType === "MOVE") return true;
  return input.completedNodeIds.includes(input.requiredNodeId) || input.interactedNodeIds.includes(input.requiredNodeId);
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = await readJsonObjectBody(request, "Payload inválido para interacción Story.");
    const nodeId = readRequiredStringField(payload, "nodeId", "Nodo de interacción inválido.");
    assertValidStoryNodeId(nodeId);
    const virtualNode = findStoryVirtualNodeDefinition(nodeId);
    if (!virtualNode) throw new ValidationError("Solo se permiten nodos virtuales de interacción Story.");

    const opponentRepository = new SupabaseOpponentRepository(repositories.client);
    const duelProgressRepository = new SupabasePlayerStoryDuelProgressRepository(repositories.client);
    const worldRepository = new SupabasePlayerStoryWorldRepository(repositories.client);
    const worldStateUseCase = new GetStoryWorldStateUseCase(opponentRepository, duelProgressRepository);
    const worldState = await worldStateUseCase.execute({ playerId });
    const compactState = await worldRepository.getCompactStateByPlayerId(playerId);

    const unlocked = canInteractVirtualNode({
      requiredNodeId: virtualNode.unlockRequirementNodeId,
      completedNodeIds: worldState.progress.completedNodeIds,
      interactedNodeIds: compactState.interactedNodeIds,
    });
    if (!unlocked) {
      throw new ValidationError("El nodo virtual todavía está bloqueado.");
    }
    if (compactState.interactedNodeIds.includes(virtualNode.id)) {
      return NextResponse.json(
        {
          interactionCountForNode: 1,
        },
        { status: 200, headers: response.headers },
      );
    }
    const nextState = applyStoryInteractionToCompactState({
      state: compactState,
      nodeId: virtualNode.id,
    });
    if (virtualNode.nodeType === "REWARD_NEXUS" && virtualNode.rewardNexus > 0) {
      await repositories.walletRepository.creditNexus(playerId, virtualNode.rewardNexus);
    }
    if (virtualNode.nodeType === "REWARD_CARD" && virtualNode.rewardCardId) {
      await repositories.collectionRepository.addCards(playerId, [virtualNode.rewardCardId]);
    }
    await worldRepository.saveCompactStateByPlayerId(playerId, nextState);
    const interactionCountForNode = nextState.interactedNodeIds.includes(virtualNode.id) ? 1 : 0;

    return NextResponse.json(
      {
        interactionCountForNode,
      },
      { status: 200, headers: response.headers },
    );
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo registrar la interacción Story.");
  }
}
