// src/app/api/player/profile/route.ts - Endpoint PATCH para actualizar nickname del perfil del jugador autenticado.
import { NextRequest, NextResponse } from "next/server";
import { GetOrCreatePlayerProfileUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProfileUseCase";
import { SupabasePlayerProfileRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProfileRepository";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { resolveDefaultNicknameFromEmail } from "@/services/player-profile/resolve-default-nickname-from-email";
import { consumePlayerProfileRateLimit } from "@/services/player-profile/api/security/player-profile-rate-limiter";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { resolveRequestClientIp } from "@/services/security/api/request-client-ip";
import { readJsonObjectBody } from "@/services/security/api/request-body-parser";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readPlayerProfileUpdatePayload } from "./internal/read-player-profile-payload";

/**
 * Actualiza nickname del perfil con estrategia forzada o bootstrap condicionado.
 */
export async function PATCH(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const clientIp = resolveRequestClientIp(request);
    const limitByIp = await consumePlayerProfileRateLimit(`player-profile:update:ip:${clientIp}`, 20, 10 * 60 * 1000);
    const limitByPlayer = await consumePlayerProfileRateLimit(`player-profile:update:user:${playerId}`, 8, 5 * 60 * 1000);
    if (!limitByIp || !limitByPlayer) {
      return NextResponse.json(
        { message: "Demasiadas actualizaciones de perfil. Espera unos minutos e inténtalo de nuevo." },
        { status: 429, headers: response.headers },
      );
    }
    const payload = await readJsonObjectBody(request, "Payload inválido para actualizar perfil.");
    const command = readPlayerProfileUpdatePayload(payload);
    const profileRepository = new SupabasePlayerProfileRepository(repositories.client);
    const userResult = await repositories.client.auth.getUser();
    const defaultNickname = resolveDefaultNicknameFromEmail(userResult.data.user?.email ?? null);
    const currentProfile = await new GetOrCreatePlayerProfileUseCase(profileRepository).execute({
      playerId,
      defaultNickname,
    });
    if (
      command.strategy === "bootstrap_if_default"
      && currentProfile.nickname !== defaultNickname
      && currentProfile.nickname !== "Operador"
    ) {
      return NextResponse.json({ profile: currentProfile, applied: false }, { status: 200, headers: response.headers });
    }
    const updatedProfile = currentProfile.nickname === command.nickname
      ? currentProfile
      : await profileRepository.update({ playerId, nickname: command.nickname });
    return NextResponse.json({ profile: updatedProfile, applied: true }, { status: 200, headers: response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo actualizar el perfil del jugador.");
  }
}
