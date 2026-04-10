// src/app/api/story/world/interact/route.ts - Registra interacciones narrativas de nodos Story virtuales y devuelve historial actualizado.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { assertValidStoryNodeId } from "@/core/use-cases/story/internal/assert-valid-story-node-id";
import { findStoryVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-registry";
import { applyStoryInteractionToCompactState } from "@/services/story/story-compact-state";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";
import { createStoryWorldInteractionRouteContext } from "@/services/story/api/create-story-world-interaction-route-context";
import { assertStoryNodeSubmissionRequirements, assertStoryNodeSubmissionValid } from "@/services/story/story-node-submission-rules";

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
    const context = await createStoryWorldInteractionRouteContext(request);
    const payload = await readJsonObjectBody(request, "Payload inválido para interacción Story.");
    const nodeId = readRequiredStringField(payload, "nodeId", "Nodo de interacción inválido.");
    const rawSubmissionAnswer = payload.submissionAnswer;
    const submissionAnswer = typeof rawSubmissionAnswer === "string" ? rawSubmissionAnswer : null;
    assertValidStoryNodeId(nodeId);
    const virtualNode = findStoryVirtualNodeDefinition(nodeId);
    if (!virtualNode) throw new ValidationError("Solo se permiten nodos virtuales de interacción Story.");

    const worldState = await context.worldStateUseCase.execute({ playerId: context.playerId });
    const compactState = await context.storyWorldRepository.getCompactStateByPlayerId(context.playerId);
    assertStoryNodeSubmissionRequirements({
      nodeId,
      completedNodeIds: worldState.progress.completedNodeIds,
      interactedNodeIds: compactState.interactedNodeIds,
    });
    assertStoryNodeSubmissionValid(nodeId, submissionAnswer);

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
        { status: 200, headers: context.response.headers },
      );
    }
    const nextState = applyStoryInteractionToCompactState({
      state: compactState,
      nodeId: virtualNode.id,
    });
    if (virtualNode.nodeType === "REWARD_NEXUS" && virtualNode.rewardNexus > 0) {
      await context.repositories.walletRepository.creditNexus(context.playerId, virtualNode.rewardNexus);
    }
    if (virtualNode.nodeType === "REWARD_CARD" && virtualNode.rewardCardId) {
      await context.repositories.collectionRepository.addCards(context.playerId, [virtualNode.rewardCardId]);
    }
    await context.storyWorldRepository.saveCompactStateByPlayerId(context.playerId, nextState);
    const interactionCountForNode = nextState.interactedNodeIds.includes(virtualNode.id) ? 1 : 0;

    return NextResponse.json(
      {
        interactionCountForNode,
      },
      { status: 200, headers: context.response.headers },
    );
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo registrar la interacción Story.");
  }
}
