// src/services/story/get-story-duel-runtime-data.ts - Resuelve datos de ejecución de un duelo Story (jugador, oponente, mazos y acceso).
import { ICard } from "@/core/entities/ICard";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { getPlayerBoardLoadout } from "@/services/game/get-player-board-deck";
import { createSupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/create-supabase-opponent-repository";
import { createSupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-duel-progress-repository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";

export interface IStoryDuelRuntimeData {
  playerId: string;
  playerName: string;
  chapter: number;
  duelIndex: number;
  duelTitle: string;
  duelDescription: string;
  isUnlocked: boolean;
  playerDeck: ICard[];
  playerFusionDeck: ICard[];
  opponentDeck: ICard[];
  opponentId: string;
  opponentName: string;
  opponentAvatarUrl?: string | null;
}

export async function getStoryDuelRuntimeData(chapter: number, duelIndex: number): Promise<IStoryDuelRuntimeData | null> {
  const session = await getCurrentUserSession();
  if (!session) return null;
  const loadout = await getPlayerBoardLoadout();
  const playerDeck = loadout.deck ?? [];
  const playerFusionDeck = loadout.fusionDeck ?? [];
  const opponentRepository = await createSupabaseOpponentRepository();
  const storyProgressRepository = await createSupabasePlayerStoryDuelProgressRepository();
  const duel = await opponentRepository.getStoryDuel(chapter, duelIndex);
  if (!duel) return null;

  const [allProgress, supabase] = await Promise.all([storyProgressRepository.listByPlayerId(session.user.id), createSupabaseServerClient()]);
  const wonIds = new Set(allProgress.filter((entry) => entry.bestResult === "WON").map((entry) => entry.duelId));
  const duelSummaries = await opponentRepository.listStoryDuels();
  const duelSummary = duelSummaries.find((entry) => entry.id === duel.id);
  const isUnlocked = duelSummary?.unlockRequirementDuelId ? wonIds.has(duelSummary.unlockRequirementDuelId) : true;

  const cardsById = await loadCardsByIds(supabase, duel.opponentDeckCardIds);
  const opponentDeck = duel.opponentDeckCardIds.flatMap((cardId) => {
    const card = cardsById.get(cardId);
    return card ? [{ ...card }] : [];
  });

  return {
    playerId: session.user.id,
    playerName: session.user.displayName ?? session.user.email ?? "Arquitecto",
    chapter: duel.chapter,
    duelIndex: duel.duelIndex,
    duelTitle: duel.title,
    duelDescription: duel.description,
    isUnlocked,
    playerDeck,
    playerFusionDeck,
    opponentDeck,
    opponentId: duel.opponentId,
    opponentName: duel.opponentName,
    opponentAvatarUrl: duel.opponentAvatarUrl ?? null,
  };
}
