// src/app/api/story/duels/complete/route.ts - Registra resultado de duelo Story y aplica recompensas de primera victoria.
import { NextRequest, NextResponse } from "next/server";
import { processStoryDuelCompletion } from "@/app/api/story/duels/complete/internal/process-story-duel-completion";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { readJsonObjectBody, readRequiredStringField } from "@/services/security/api/request-body-parser";
import { verifyStoryCompletionTicket } from "@/services/security/duel-completion-ticket";
import { createStoryDuelCompletionRouteContext } from "@/services/story/api/create-story-duel-completion-route-context";

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createStoryDuelCompletionRouteContext(request);
    const payload = await readJsonObjectBody(request, "Payload inválido para cierre de duelo Story.");
    const completionTicket = readRequiredStringField(payload, "completionTicket", "Falta el ticket de cierre Story.");
    const validatedTicket = verifyStoryCompletionTicket(completionTicket, context.playerId);
    const result = await processStoryDuelCompletion({
      playerId: context.playerId,
      payload: {
        chapter: validatedTicket.chapter,
        duelIndex: validatedTicket.duelIndex,
        outcome: payload.outcome,
      },
      opponentRepository: context.opponentRepository,
      storyProgressRepository: context.storyProgressRepository,
      storyWorldRepository: context.storyWorldRepository,
      playerProgressRepository: context.playerProgressRepository,
      walletRepository: context.repositories.walletRepository,
      collectionRepository: context.repositories.collectionRepository,
      loadCardsByIds: context.loadCardsByIds,
    });
    return NextResponse.json(result, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo registrar el resultado del duelo Story.");
  }
}
