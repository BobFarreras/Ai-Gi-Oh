// src/services/story/get-story-duel-runtime-data.ts - Resuelve datos de ejecución de un duelo Story (jugador, oponente, mazos y acceso).
import { ICard } from "@/core/entities/ICard";
import { GetStoryWorldStateUseCase } from "@/core/use-cases/story/GetStoryWorldStateUseCase";
import { IStoryAiProfile, normalizeStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { getPlayerBoardLoadout } from "@/services/game/get-player-board-deck";
import { createSupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/create-supabase-opponent-repository";
import { createSupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-duel-progress-repository";
import { createSupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-world-repository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";

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
  opponentId: string;
  opponentName: string;
  opponentAvatarUrl?: string | null;
  opponentDifficulty: StoryOpponentDifficulty;
  opponentAiProfile: IStoryAiProfile;
}

function applyStoryDeckEntryToCard(
  card: ICard,
  entry: { versionTier: number; level: number; xp: number; attackOverride: number | null; defenseOverride: number | null; effectOverride: Record<string, unknown> | null },
): ICard {
  return {
    ...card,
    versionTier: entry.versionTier,
    level: entry.level,
    xp: entry.xp,
    attack: entry.attackOverride ?? card.attack,
    defense: entry.defenseOverride ?? card.defense,
    effect: (entry.effectOverride as ICard["effect"] | null) ?? card.effect,
  };
}

export async function getStoryDuelRuntimeData(chapter: number, duelIndex: number): Promise<IStoryDuelRuntimeData | null> {
  const session = await getCurrentUserSession();
  if (!session) return null;
  const loadout = await getPlayerBoardLoadout();
  const playerDeck = loadout.deck ?? [];
  const playerFusionDeck = loadout.fusionDeck ?? [];
  const opponentRepository = await createSupabaseOpponentRepository();
  const storyProgressRepository = await createSupabasePlayerStoryDuelProgressRepository();
  const storyWorldRepository = await createSupabasePlayerStoryWorldRepository();
  const duel = await opponentRepository.getStoryDuel(chapter, duelIndex);
  if (!duel) return null;
  const worldStateUseCase = new GetStoryWorldStateUseCase(opponentRepository, storyProgressRepository);
  const [worldState, currentNodeId, supabase] = await Promise.all([
    worldStateUseCase.execute({ playerId: session.user.id }),
    storyWorldRepository.getCurrentNodeIdByPlayerId(session.user.id).catch(() => null),
    createSupabaseServerClient(),
  ]);
  const isUnlocked = worldState.progress.unlockedNodeIds.includes(duel.id);
  const isCurrentNode = currentNodeId === null || currentNodeId === duel.id;

  const cardsById = await loadCardsByIds(supabase, duel.opponentDeckEntries.map((entry) => entry.cardId));
  const opponentDeck = duel.opponentDeckEntries.flatMap((entry) => {
    const card = cardsById.get(entry.cardId);
    return card ? [{ ...card }] : [];
  }).map((card, index) => applyStoryDeckEntryToCard(card, duel.opponentDeckEntries[index]));

  return {
    playerId: session.user.id,
    playerName: session.user.displayName ?? session.user.email ?? "Arquitecto",
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
    opponentId: duel.opponentId,
    opponentName: duel.opponentName,
    opponentAvatarUrl: duel.opponentAvatarUrl ?? null,
    opponentDifficulty: duel.opponentDifficulty,
    opponentAiProfile: normalizeStoryAiProfile(duel.opponentAiProfile, duel.opponentDifficulty),
  };
}
