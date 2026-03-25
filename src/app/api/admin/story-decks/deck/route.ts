// src/app/api/admin/story-decks/deck/route.ts - Endpoint admin para consultar y guardar mazos Story de oponentes.
import { NextRequest, NextResponse } from "next/server";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";
import { createAdminStoryDeckContext } from "@/services/admin/api/create-admin-story-deck-context";
import { readAdminSaveStoryDeckCommand } from "@/services/admin/api/read-admin-story-deck-command";

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminStoryDeckContext(request);
    const opponentId = request.nextUrl.searchParams.get("opponentId") ?? undefined;
    const deckListId = request.nextUrl.searchParams.get("deckListId") ?? undefined;
    const data = await context.getDataUseCase.execute({ opponentId, deckListId });
    const availableCards = await context.repository.listAvailableCards();
    return NextResponse.json({ ...data, availableCards }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar los Story Decks.");
  }
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const command = await readAdminSaveStoryDeckCommand(request);
    const context = await createAdminStoryDeckContext(request);
    await context.saveDeckUseCase.execute(command);
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar el Story Deck.");
  }
}

