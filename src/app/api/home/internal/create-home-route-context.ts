// src/app/api/home/internal/create-home-route-context.ts - Crea contexto autenticado para operaciones de deck builder con persistencia real.
import { NextRequest, NextResponse } from "next/server";
import { AddCardToFusionDeckUseCase } from "@/core/use-cases/home/AddCardToFusionDeckUseCase";
import { AddCardToDeckUseCase } from "@/core/use-cases/home/AddCardToDeckUseCase";
import { EvolveCardVersionUseCase } from "@/core/use-cases/home/EvolveCardVersionUseCase";
import { RemoveCardFromFusionDeckUseCase } from "@/core/use-cases/home/RemoveCardFromFusionDeckUseCase";
import { RemoveCardFromDeckUseCase } from "@/core/use-cases/home/RemoveCardFromDeckUseCase";
import { SaveDeckUseCase } from "@/core/use-cases/home/SaveDeckUseCase";
import { SwapActiveDeckUseCase } from "@/core/use-cases/home/SwapActiveDeckUseCase";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";
import { BankDeckRepositoryAdapter } from "@/infrastructure/persistence/supabase/BankDeckRepositoryAdapter";

export async function createHomeRouteContext(request: NextRequest) {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  const repositories = await createPlayerRouteRepositories(request, response);
  const playerId = await getAuthenticatedUserId(repositories.client);
  // Doble Arsenal: si la petición trae ?slot=SECONDARY, las operaciones de deck (añadir/quitar/mover/fusión/
  // guardar/leer) editan el 2º mazo (banco) reutilizando los mismos use-cases vía el adaptador. Por defecto,
  // el mazo ACTIVO (comportamiento de siempre). El swap y evolución siempre van sobre el repositorio base.
  const editSecondDeck = request.nextUrl.searchParams.get("slot") === "SECONDARY";
  const deckRepository = editSecondDeck ? new BankDeckRepositoryAdapter(repositories.deckRepository) : repositories.deckRepository;
  return {
    response,
    playerId,
    repositories,
    deckRepository,
    addCardUseCase: new AddCardToDeckUseCase(deckRepository),
    addFusionCardUseCase: new AddCardToFusionDeckUseCase(deckRepository),
    removeCardUseCase: new RemoveCardFromDeckUseCase(deckRepository),
    removeFusionCardUseCase: new RemoveCardFromFusionDeckUseCase(deckRepository),
    saveDeckUseCase: new SaveDeckUseCase(deckRepository),
    swapActiveDeckUseCase: new SwapActiveDeckUseCase(repositories.deckRepository),
    evolveCardVersionUseCase: new EvolveCardVersionUseCase(
      repositories.collectionRepository,
      repositories.deckRepository,
      repositories.playerCardProgressRepository,
    ),
  };
}
