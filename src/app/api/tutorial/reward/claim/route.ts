// src/app/api/tutorial/reward/claim/route.ts - Endpoint para reclamar recompensa final del tutorial de forma idempotente.
import { NextRequest, NextResponse } from "next/server";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { SupabaseTutorialNodeProgressRepository } from "@/infrastructure/persistence/supabase/SupabaseTutorialNodeProgressRepository";
import { SupabaseTutorialRewardClaimRepository } from "@/infrastructure/persistence/supabase/SupabaseTutorialRewardClaimRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { processTutorialRewardClaim } from "./internal/process-tutorial-reward-claim";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const result = await processTutorialRewardClaim({
      playerId,
      dependencies: {
        nodeProgressRepository: new SupabaseTutorialNodeProgressRepository(repositories.client),
        rewardClaimRepository: new SupabaseTutorialRewardClaimRepository(repositories.client),
        walletRepository: repositories.walletRepository,
        playerProgressRepository: new SupabasePlayerProgressRepository(repositories.client),
      },
    });
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo reclamar la recompensa final del tutorial.");
  }
}
