// src/app/api/story/world/reset/route.ts - Reinicia estado navegable Story compacto (posición, visitados e interacciones).
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { SupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";

const STORY_DEFAULT_START_NODE_ID = "story-ch1-player-start";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const worldRepository = new SupabasePlayerStoryWorldRepository(repositories.client);
    await worldRepository.saveCompactStateByPlayerId(playerId, {
      currentNodeId: STORY_DEFAULT_START_NODE_ID,
      visitedNodeIds: [STORY_DEFAULT_START_NODE_ID],
      interactedNodeIds: [],
    });
    return NextResponse.json(
      {
        currentNodeId: STORY_DEFAULT_START_NODE_ID,
      },
      { status: 200, headers: response.headers },
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "No se pudo reiniciar el estado Story." }, { status: 400 });
  }
}
