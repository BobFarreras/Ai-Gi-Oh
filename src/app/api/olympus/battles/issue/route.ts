// src/app/api/olympus/battles/issue/route.ts - Emite o reanuda la batalla legendaria del jugador.
import { NextRequest, NextResponse } from "next/server";
import { COMBAT_SETTLEMENT_GRACE_MS } from "@/core/entities/match";
import { IssueOlympusBattleUseCase } from "@/core/use-cases/olympus/IssueOlympusBattleUseCase";
import { ValidationError } from "@/core/errors/ValidationError";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { enforcePveRateLimit } from "@/services/security/api/rate-limit/enforce-pve-rate-limit";
import { issueCombatSessionTicket } from "@/services/security/duel-completion-ticket";
import { buildOlympusBattleSnapshot } from "@/services/olympus/build-olympus-battle-snapshot";
import { createOlympusRouteContext } from "@/services/olympus/create-olympus-route-context";
import { resolveOlympusPresentation } from "@/services/olympus/resolve-olympus-presentation";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createOlympusRouteContext(request);
    const rateLimited = await enforcePveRateLimit(request, context.playerId, {
      mode: "olympus", operation: "issue", maxPerPlayer: 30, maxPerIp: 60, windowMs: 5 * 60 * 1000,
    }, context.response.headers);
    if (rateLimited) return rateLimited;
    const body = await readJsonObjectBody(request, "Payload inválido para emitir combate.");
    const championId = readRequiredStringField(body, "championId", "El campeón es obligatorio.");
    const opponentId = readRequiredStringField(body, "opponentId", "La leyenda es obligatoria.");

    const useCase = new IssueOlympusBattleUseCase(
      context.repository,
      (champion, legend, nodes, nodeRanks, seed) => buildOlympusBattleSnapshot({
        playerId: context.playerId,
        champion, legend, nodes, nodeRanks, seed,
        repository: context.repository,
      }),
    );
    const result = await useCase.execute({
      playerId: context.playerId,
      championId,
      opponentId,
      battleId: crypto.randomUUID(),
      seed: crypto.randomUUID(),
    });

    const [stored, presentation] = await Promise.all([
      context.repository.getCombatSession(context.playerId, result.battle.battleId),
      resolveOlympusPresentation(result.champion, result.legend),
    ]);
    if (!stored) throw new ValidationError("La sesión emitida no está disponible.");
    const completionTicket = issueCombatSessionTicket({
      playerId: context.playerId,
      mode: "OLYMPUS",
      sessionId: stored.session.id,
      battleId: stored.session.battleId,
      snapshotHash: stored.session.snapshotHash,
      protocolVersion: stored.session.protocolVersion,
      // El ticket debe sobrevivir a la sesión, o un duelo lento no podría liquidarse ni con margen.
      ttlMs: result.battleTtlMinutes * 60 * 1000 + COMBAT_SETTLEMENT_GRACE_MS,
    });
    return NextResponse.json({
      battle: result.battle,
      champion: result.champion,
      legend: result.legend,
      resumed: result.resumed,
      session: stored.session,
      initialState: stored.snapshot,
      // Avance ya registrado: el cliente lo reproduce para retomar el combate donde estaba.
      journalEntries: stored.journalEntries,
      completionTicket,
      presentation,
      // El cliente no elige la dificultad: debe animar con el mismo perfil que el servidor reproducirá.
      aiProfile: result.aiProfile,
    }, {
      status: result.resumed ? 200 : 201,
      headers: context.response.headers,
    });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo emitir el combate de Olimpo.");
  }
}
