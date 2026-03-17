// src/app/api/story/duels/complete/route.ts - Registra resultado de duelo Story y aplica recompensas de primera victoria.
import { NextRequest, NextResponse } from "next/server";
import { SupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentRepository";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";
import { SupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { processStoryDuelCompletion } from "@/app/api/story/duels/complete/internal/process-story-duel-completion";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = await readJsonObjectBody(request, "Payload inválido para cierre de duelo Story.");
    const result = await processStoryDuelCompletion({
      playerId,
      payload,
      opponentRepository: new SupabaseOpponentRepository(repositories.client),
      storyProgressRepository: new SupabasePlayerStoryDuelProgressRepository(repositories.client),
      storyWorldRepository: new SupabasePlayerStoryWorldRepository(repositories.client),
      playerProgressRepository: new SupabasePlayerProgressRepository(repositories.client),
      walletRepository: repositories.walletRepository,
      collectionRepository: repositories.collectionRepository,
      loadCardsByIds: (cardIds) => loadCardsByIds(repositories.client, cardIds),
    });
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo registrar el resultado del duelo Story.");
  }
}
