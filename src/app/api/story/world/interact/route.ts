// src/app/api/story/world/interact/route.ts - Registra interacciones narrativas de nodos Story virtuales y devuelve historial actualizado.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { GetStoryWorldStateUseCase } from "@/core/use-cases/story/GetStoryWorldStateUseCase";
import { RegisterStoryInteractionUseCase } from "@/core/use-cases/story/RegisterStoryInteractionUseCase";
import { assertValidStoryNodeId } from "@/core/use-cases/story/internal/assert-valid-story-node-id";
import { SupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentRepository";
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";
import { SupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { findStoryVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-registry";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";

interface IStoryWorldInteractPayload {
  nodeId: string;
}

function canInteractVirtualNode(input: {
  requiredNodeId: string | null;
  completedNodeIds: string[];
  interactedNodeIds: string[];
}): boolean {
  if (!input.requiredNodeId) return true;
  return input.completedNodeIds.includes(input.requiredNodeId) || input.interactedNodeIds.includes(input.requiredNodeId);
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = (await request.json()) as IStoryWorldInteractPayload;
    if (!payload.nodeId || typeof payload.nodeId !== "string") {
      throw new ValidationError("Nodo de interacción inválido.");
    }
    assertValidStoryNodeId(payload.nodeId);
    const virtualNode = findStoryVirtualNodeDefinition(payload.nodeId);
    if (!virtualNode) throw new ValidationError("Solo se permiten nodos virtuales de interacción Story.");

    const opponentRepository = new SupabaseOpponentRepository(repositories.client);
    const duelProgressRepository = new SupabasePlayerStoryDuelProgressRepository(repositories.client);
    const worldRepository = new SupabasePlayerStoryWorldRepository(repositories.client);
    const worldStateUseCase = new GetStoryWorldStateUseCase(opponentRepository, duelProgressRepository);
    const worldState = await worldStateUseCase.execute({ playerId });
    const currentHistory = await worldRepository.listHistoryByPlayerId(playerId, 200);
    const interactedNodeIds = currentHistory
      .filter((event) => event.kind === "INTERACTION")
      .map((event) => event.nodeId);

    const unlocked = canInteractVirtualNode({
      requiredNodeId: virtualNode.unlockRequirementNodeId,
      completedNodeIds: worldState.progress.completedNodeIds,
      interactedNodeIds,
    });
    if (!unlocked) {
      throw new ValidationError("El nodo virtual todavía está bloqueado.");
    }

    const registerUseCase = new RegisterStoryInteractionUseCase(worldRepository);
    await registerUseCase.execute({
      playerId,
      nodeId: virtualNode.id,
      details: `Interacción narrativa completada: ${virtualNode.title}.`,
      nowIso: new Date().toISOString(),
    });

    const history = await worldRepository.listHistoryByPlayerId(playerId, 60);
    const interactionCountForNode = history.filter(
      (event) => event.nodeId === virtualNode.id && event.kind === "INTERACTION",
    ).length;

    return NextResponse.json(
      {
        history,
        interactionCountForNode,
      },
      { status: 200, headers: response.headers },
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo registrar la interacción Story." }, { status: 400 });
  }
}
