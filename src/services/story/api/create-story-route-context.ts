// src/services/story/api/create-story-route-context.ts - Construye contexto autenticado base para endpoints Story mutables con persistencia de jugador.
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";

export async function createStoryRouteContext(request: NextRequest) {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  const repositories = await createPlayerRouteRepositories(request, response);
  const playerId = await getAuthenticatedUserId(repositories.client);
  return {
    response,
    repositories,
    playerId,
  };
}
