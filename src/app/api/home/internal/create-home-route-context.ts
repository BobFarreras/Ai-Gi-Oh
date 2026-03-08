// src/app/api/home/internal/create-home-route-context.ts - Crea contexto autenticado para operaciones de deck builder con persistencia real.
import { NextRequest, NextResponse } from "next/server";
import { AddCardToFusionDeckUseCase } from "@/core/use-cases/home/AddCardToFusionDeckUseCase";
import { AddCardToDeckUseCase } from "@/core/use-cases/home/AddCardToDeckUseCase";
import { EvolveCardVersionUseCase } from "@/core/use-cases/home/EvolveCardVersionUseCase";
import { RemoveCardFromFusionDeckUseCase } from "@/core/use-cases/home/RemoveCardFromFusionDeckUseCase";
import { RemoveCardFromDeckUseCase } from "@/core/use-cases/home/RemoveCardFromDeckUseCase";
import { SaveDeckUseCase } from "@/core/use-cases/home/SaveDeckUseCase";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";

export async function createHomeRouteContext(request: NextRequest) {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  const repositories = await createPlayerRouteRepositories(request, response);
  const playerId = await getAuthenticatedUserId(repositories.client);
  return {
    response,
    playerId,
    repositories,
    addCardUseCase: new AddCardToDeckUseCase(repositories.deckRepository),
    addFusionCardUseCase: new AddCardToFusionDeckUseCase(repositories.deckRepository),
    removeCardUseCase: new RemoveCardFromDeckUseCase(repositories.deckRepository),
    removeFusionCardUseCase: new RemoveCardFromFusionDeckUseCase(repositories.deckRepository),
    saveDeckUseCase: new SaveDeckUseCase(repositories.deckRepository),
    evolveCardVersionUseCase: new EvolveCardVersionUseCase(
      repositories.collectionRepository,
      repositories.deckRepository,
      repositories.playerCardProgressRepository,
    ),
  };
}
