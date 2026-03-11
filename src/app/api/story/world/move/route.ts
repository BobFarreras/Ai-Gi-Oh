// src/app/api/story/world/move/route.ts - Mueve el cursor del mapa Story entre nodos desbloqueados y conectados.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerStoryHistoryEvent } from "@/core/entities/story/IPlayerStoryHistoryEvent";
import { CommitStoryProgressUseCase } from "@/core/use-cases/story/CommitStoryProgressUseCase";
import { GetStoryWorldStateUseCase } from "@/core/use-cases/story/GetStoryWorldStateUseCase";
import { MoveToStoryNodeUseCase } from "@/core/use-cases/story/MoveToStoryNodeUseCase";
import { assertValidStoryNodeId } from "@/core/use-cases/story/internal/assert-valid-story-node-id";
import { SupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentRepository";
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";
import { SupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { resolveStoryWorldMoveMode } from "@/services/story/resolve-story-world-move-mode";
import { shouldAppendStoryMoveEvent } from "@/services/story/should-append-story-move-event";

interface IStoryWorldMovePayload {
  nodeId: string;
}

function resolveLatestHistoryNodeId(history: IPlayerStoryHistoryEvent[]): string | null {
  return history[0]?.nodeId ?? null;
}

function resolveEffectiveCurrentNodeId(input: {
  currentNodeId: string | null;
  history: IPlayerStoryHistoryEvent[];
  completedNodeIds: string[];
}): string {
  const hasProgressSignal =
    input.completedNodeIds.length > 0 ||
    input.history.some((event) => event.kind === "MOVE" || event.kind === "INTERACTION");
  if (!hasProgressSignal) return "story-ch1-player-start";
  return resolveLatestHistoryNodeId(input.history) ?? input.currentNodeId ?? "story-ch1-player-start";
}

function buildVirtualMoveEvent(input: { playerId: string; nodeId: string; title: string }): IPlayerStoryHistoryEvent {
  const nowIso = new Date().toISOString();
  return {
    eventId: `move-${input.nodeId}-${nowIso}`,
    playerId: input.playerId,
    nodeId: input.nodeId,
    kind: "MOVE",
    details: `Movimiento a nodo ${input.title}.`,
    createdAtIso: nowIso,
  };
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = (await request.json()) as IStoryWorldMovePayload;
    if (!payload.nodeId || typeof payload.nodeId !== "string") {
      throw new ValidationError("Nodo destino inválido.");
    }
    assertValidStoryNodeId(payload.nodeId);
    const opponentRepository = new SupabaseOpponentRepository(repositories.client);
    const duelProgressRepository = new SupabasePlayerStoryDuelProgressRepository(repositories.client);
    const worldRepository = new SupabasePlayerStoryWorldRepository(repositories.client);
    const worldStateUseCase = new GetStoryWorldStateUseCase(opponentRepository, duelProgressRepository);
    const worldState = await worldStateUseCase.execute({ playerId });
    const currentNodeId = await worldRepository.getCurrentNodeIdByPlayerId(playerId).catch(() => null);
    const currentHistory = await worldRepository.listHistoryByPlayerId(playerId, 500);
    const interactedNodeIds = currentHistory
      .filter((event) => event.kind === "INTERACTION")
      .map((event) => event.nodeId);
    const effectiveCurrentNodeId = resolveEffectiveCurrentNodeId({
      currentNodeId,
      history: currentHistory,
      completedNodeIds: worldState.progress.completedNodeIds,
    });
    if (payload.nodeId === effectiveCurrentNodeId) {
      return NextResponse.json(
        {
          currentNodeId: effectiveCurrentNodeId,
          history: currentHistory.slice(0, 60),
        },
        { status: 200, headers: response.headers },
      );
    }
    const moveMode = resolveStoryWorldMoveMode({
      targetNodeId: payload.nodeId,
      currentNodeId: effectiveCurrentNodeId,
      visitedNodeIds: currentHistory.map((event) => event.nodeId),
      completedNodeIds: worldState.progress.completedNodeIds,
      interactedNodeIds,
    });
    if (!moveMode.isAllowed) {
      throw new ValidationError(moveMode.validationMessage ?? "Movimiento Story inválido.");
    }
    if (moveMode.mode !== "GRAPH") {
      const targetVirtualNode = worldState.graph.nodes.find((node) => node.id === payload.nodeId);
      if (targetVirtualNode) {
        await worldRepository.saveCurrentNodeId(playerId, payload.nodeId);
      }
      if (
        shouldAppendStoryMoveEvent({
          history: currentHistory,
          targetNodeId: payload.nodeId,
        })
      ) {
        const targetNode = worldState.graph.nodes.find((node) => node.id === payload.nodeId);
        await worldRepository.appendHistoryEvents(playerId, [
          buildVirtualMoveEvent({
            playerId,
            nodeId: payload.nodeId,
            title: targetNode?.title ?? payload.nodeId,
          }),
        ]);
      }
      const history = await worldRepository.listHistoryByPlayerId(playerId, 60);
      return NextResponse.json(
        {
          currentNodeId: payload.nodeId,
          history,
        },
        { status: 200, headers: response.headers },
      );
    }
    const moveUseCase = new MoveToStoryNodeUseCase();
    const moved = moveUseCase.execute({
      graph: worldState.graph,
      progress: worldState.progress,
      toNodeId: payload.nodeId,
      nowIso: new Date().toISOString(),
    });
    const commitUseCase = new CommitStoryProgressUseCase(worldRepository);
    await commitUseCase.execute({ playerId, progress: moved });
    return NextResponse.json(
      {
        currentNodeId: moved.currentNodeId,
        history: moved.history.map((event) => ({ ...event, playerId })),
      },
      { status: 200, headers: response.headers },
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo mover el cursor Story." }, { status: 400 });
  }
}
