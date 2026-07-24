// src/services/story/get-story-duel-runtime-data.ts - Resuelve datos de ejecución de un duelo Story (jugador, oponente, mazos y acceso).
import { ICard } from "@/core/entities/ICard";
import { GetStoryWorldStateUseCase } from "@/core/use-cases/story/GetStoryWorldStateUseCase";
import { IStoryAiProfile, normalizeStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import { applyStoryDeckEntryToCard } from "@/services/story/internal/apply-story-deck-entry-to-card";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { getPlayerBoardLoadout } from "@/services/game/get-player-board-deck";
import { getPlayerCombatModifiers } from "@/services/progression/get-player-combat-modifiers";
import { getOpponentCombatModifiers } from "@/services/progression/get-opponent-combat-modifiers";
import { createSupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/create-supabase-opponent-repository";
import { createSupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-duel-progress-repository";
import { createSupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-world-repository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { getPlayerDisplayName } from "@/services/player-profile/get-player-display-name";

export interface IStoryDuelRuntimeData {
  playerId: string;
  playerName: string;
  chapter: number;
  duelIndex: number;
  duelTitle: string;
  duelDescription: string;
  isBossDuel: boolean;
  isUnlocked: boolean;
  isCurrentNode: boolean;
  playerDeck: ICard[];
  playerFusionDeck: ICard[];
  opponentDeck: ICard[];
  opponentFusionDeck: ICard[];
  opponentId: string;
  opponentName: string;
  opponentAvatarUrl?: string | null;
  opponentDifficulty: StoryOpponentDifficulty;
  opponentAiProfile: IStoryAiProfile;
  /** Bonus de combate del árbol (ficha 8) SOLO para el jugador local. */
  playerStartingLpBonus: number;
  playerMaxEnergyBonus: number;
  playerTurn1EnergyBonus: number;
  playerOpeningMulligan: boolean;
  /** Habilidades de combate asignadas al OPONENTE desde el admin (LP/energía). */
  opponentStartingLpBonus: number;
  opponentMaxEnergyBonus: number;
  opponentTurn1EnergyBonus: number;
}

function collectFusionRecipeIdsFromDeck(deck: ICard[]): string[] {
  return Array.from(
    new Set(
      deck.flatMap((card) =>
        card.type === "EXECUTION" && card.effect?.action === "FUSION_SUMMON"
          ? [card.effect.recipeId]
          : []),
    ),
  );
}

export async function getStoryDuelRuntimeData(chapter: number, duelIndex: number): Promise<IStoryDuelRuntimeData | null> {
  const session = await getCurrentUserSession();
  if (!session) return null;
  const playerDisplayName = await getPlayerDisplayName(session, "Arquitecto");
  const [loadout, combatModifiers] = await Promise.all([getPlayerBoardLoadout(), getPlayerCombatModifiers()]);
  const playerDeck = loadout.deck ?? [];
  const playerFusionDeck = loadout.fusionDeck ?? [];
  const opponentRepository = await createSupabaseOpponentRepository();
  const storyProgressRepository = await createSupabasePlayerStoryDuelProgressRepository();
  const storyWorldRepository = await createSupabasePlayerStoryWorldRepository();
  const duel = await opponentRepository.getStoryDuel(chapter, duelIndex);
  if (!duel) return null;
  const worldStateUseCase = new GetStoryWorldStateUseCase(opponentRepository, storyProgressRepository);
  const [worldState, currentNodeId, supabase, opponentCombatModifiers] = await Promise.all([
    worldStateUseCase.execute({ playerId: session.user.id }),
    storyWorldRepository.getCurrentNodeIdByPlayerId(session.user.id).catch(() => null),
    createSupabaseServerClient(),
    // Habilidades de combate POR DUELO: la clave es el id del duelo (no el del oponente), así un mismo rival
    // puede tener habilidades distintas en cada uno de sus combates del acto (escalado).
    getOpponentCombatModifiers(duel.id, "story"),
  ]);
  const isUnlocked = worldState.progress.unlockedNodeIds.includes(duel.id);
  const isCurrentNode = currentNodeId === duel.id;

  const opponentFusionDeckCardIds = duel.opponentFusionDeckCardIds ?? [];
  const cardsById = await loadCardsByIds(supabase, [...duel.opponentDeckEntries.map((entry) => entry.cardId), ...opponentFusionDeckCardIds]);
  // Cada entrada se hidrata con SU fila: si una carta falta del catálogo se omite sin correr los índices (antes
  // el `.map` posterior leía `opponentDeckEntries[index]` del array ya filtrado y los atributos saltaban de carta).
  const opponentDeck = duel.opponentDeckEntries.flatMap((entry) => {
    const card = cardsById.get(entry.cardId);
    return card ? [applyStoryDeckEntryToCard(card, entry)] : [];
  });
  const inferredFusionRecipeIds = collectFusionRecipeIdsFromDeck(opponentDeck);
  const missingInCatalog = inferredFusionRecipeIds.filter((id) => !cardsById.has(id));
  const inferredFusionCardsById = missingInCatalog.length > 0 ? await loadCardsByIds(supabase, missingInCatalog) : new Map<string, ICard>();
  const resolvedFusionIds = Array.from(new Set([...opponentFusionDeckCardIds, ...inferredFusionRecipeIds]));
  const opponentFusionDeck = resolvedFusionIds.flatMap((cardId) => {
    const card = cardsById.get(cardId) ?? inferredFusionCardsById.get(cardId);
    return card ? [{ ...card }] : [];
  });

  return {
    playerId: session.user.id,
    playerName: playerDisplayName,
    chapter: duel.chapter,
    duelIndex: duel.duelIndex,
    duelTitle: duel.title,
    duelDescription: duel.description,
    isBossDuel: duel.isBossDuel,
    isUnlocked,
    isCurrentNode,
    playerDeck,
    playerFusionDeck,
    opponentDeck,
    opponentFusionDeck,
    opponentId: duel.opponentId,
    opponentName: duel.opponentName,
    opponentAvatarUrl: duel.opponentAvatarUrl ?? null,
    opponentDifficulty: duel.opponentDifficulty,
    opponentAiProfile: normalizeStoryAiProfile(duel.opponentAiProfile, duel.opponentDifficulty),
    playerStartingLpBonus: combatModifiers.startingLpBonus,
    playerMaxEnergyBonus: combatModifiers.maxEnergyBonus,
    playerTurn1EnergyBonus: combatModifiers.turn1EnergyBonus,
    playerOpeningMulligan: combatModifiers.openingMulligan,
    opponentStartingLpBonus: opponentCombatModifiers.startingLpBonus,
    opponentMaxEnergyBonus: opponentCombatModifiers.maxEnergyBonus,
    opponentTurn1EnergyBonus: opponentCombatModifiers.turn1EnergyBonus,
  };
}
