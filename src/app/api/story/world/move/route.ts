// src/app/api/story/world/move/route.ts - Mueve el cursor del mapa Story entre nodos desbloqueados y conectados.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { CommitStoryProgressUseCase } from "@/core/use-cases/story/CommitStoryProgressUseCase";
import { GetStoryWorldStateUseCase } from "@/core/use-cases/story/GetStoryWorldStateUseCase";
import { MoveToStoryNodeUseCase } from "@/core/use-cases/story/MoveToStoryNodeUseCase";
import { assertValidStoryNodeId } from "@/core/use-cases/story/internal/assert-valid-story-node-id";
import { SupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentRepository";
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";
import { SupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";

interface IStoryWorldMovePayload {
  nodeId: string;
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
