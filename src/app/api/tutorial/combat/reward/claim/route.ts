// src/app/api/tutorial/combat/reward/claim/route.ts - Endpoint para reclamar la carta final del tutorial de combate con persistencia en almacén.
import { NextRequest, NextResponse } from "next/server";
import { SupabaseTutorialNodeProgressRepository } from "@/infrastructure/persistence/supabase/SupabaseTutorialNodeProgressRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { processTutorialCombatRewardClaim } from "./internal/process-tutorial-combat-reward-claim";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const result = await processTutorialCombatRewardClaim({
      playerId,
      dependencies: {
        nodeProgressRepository: new SupabaseTutorialNodeProgressRepository(repositories.client),
        collectionRepository: repositories.collectionRepository,
      },
    });
    return NextResponse.json(result, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo reclamar la carta de recompensa del tutorial de combate.");
  }
}
