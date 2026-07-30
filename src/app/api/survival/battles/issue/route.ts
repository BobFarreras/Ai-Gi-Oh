// src/app/api/survival/battles/issue/route.ts - Emite o reanuda el siguiente combate Survival.
import { NextRequest, NextResponse } from "next/server";
import { IssueSurvivalBattleUseCase } from "@/core/use-cases/survival/IssueSurvivalBattleUseCase";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { buildSurvivalBattleSnapshot } from "@/services/survival/build-survival-battle-snapshot";
import { createSurvivalRouteContext } from "@/services/survival/create-survival-route-context";
import { issueCombatSessionTicket } from "@/services/security/duel-completion-ticket";
import { ValidationError } from "@/core/errors/ValidationError";

const BATTLE_TTL_MS = 1000 * 60 * 45;

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createSurvivalRouteContext(request);
    const body = await readJsonObjectBody(request, "Payload inválido para emitir combate.");
    const runId = readRequiredStringField(body, "runId", "La expedición es obligatoria.");
    const battleId = crypto.randomUUID();
    const seed = crypto.randomUUID();
    const expiresAtIso = new Date(Date.now() + BATTLE_TTL_MS).toISOString();
    const useCase = new IssueSurvivalBattleUseCase(
      context.repository,
      (run, encounter, battleSeed) => buildSurvivalBattleSnapshot(
        context.playerId,
        run,
        encounter,
        battleSeed,
      ),
    );
    const result = await useCase.execute({ playerId: context.playerId, runId, battleId, seed, expiresAtIso });
    const stored = await context.repository.getCombatSession(context.playerId, result.battle.battleId);
    if (!stored) throw new ValidationError("La sesión emitida no está disponible.");
    const completionTicket = issueCombatSessionTicket({
      playerId: context.playerId,
      mode: "SURVIVAL",
      sessionId: stored.session.id,
      battleId: stored.session.battleId,
      snapshotHash: stored.session.snapshotHash,
      protocolVersion: stored.session.protocolVersion,
      ttlMs: BATTLE_TTL_MS,
    });
    return NextResponse.json({
      ...result,
      session: stored.session,
      initialState: stored.snapshot,
      completionTicket,
    }, {
      status: result.resumed ? 200 : 201,
      headers: context.response.headers,
    });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo emitir el combate de Supervivencia.");
  }
}
