// src/services/multiplayer/get-match-session-data.ts - Carga server-side de la sesión de partida y los mazos de ambos jugadores.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { ICard } from "@/core/entities/ICard";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";

interface IMatchSessionRow {
  id: string;
  player_a_id: string;
  player_b_id: string;
  deck_a_ids: string[];
  deck_b_ids: string[];
  seed: string;
  status: string;
  player_a_profile: { nickname: string } | null;
  player_b_profile: { nickname: string } | null;
}

export interface IMatchSessionData {
  matchId: string;
  seed: string;
  localPlayerId: string;
  opponentId: string;
  localNickname: string;
  opponentNickname: string;
  localDeck: ICard[];
  opponentDeck: ICard[];
  isPlayerA: boolean;
  status: string;
}

export async function getMatchSessionData(matchId: string): Promise<IMatchSessionData | null> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return null;

  const supabase = await createSupabaseServerClient();

  const { data: matchSession } = await supabase
    .from("match_sessions")
    .select("*, player_a_profile:player_profiles!player_a_id(nickname), player_b_profile:player_profiles!player_b_id(nickname)")
    .eq("id", matchId)
    .single<IMatchSessionRow>();

  if (!matchSession) return null;

  const localPlayerId = session.user.id;
  const isPlayerA = matchSession.player_a_id === localPlayerId;
  if (!isPlayerA && matchSession.player_b_id !== localPlayerId) return null;

  const opponentId = isPlayerA ? matchSession.player_b_id : matchSession.player_a_id;
  const localDeckIds = isPlayerA ? matchSession.deck_a_ids : matchSession.deck_b_ids;
  const opponentDeckIds = isPlayerA ? matchSession.deck_b_ids : matchSession.deck_a_ids;

  // Las cartas viven en el catálogo en código (no hay tabla `cards` en la DB).
  // Resolver por ID garantiza el mismo objeto de carta en ambos clientes.
  const resolveDeck = (ids: string[]): ICard[] =>
    ids.map((id) => CARD_BY_ID.get(id)).filter((c): c is ICard => c !== undefined);
  const localDeck = resolveDeck(localDeckIds);
  const opponentDeck = resolveDeck(opponentDeckIds);

  return {
    matchId,
    seed: matchSession.seed,
    localPlayerId,
    opponentId,
    isPlayerA,
    localNickname: isPlayerA
      ? (matchSession.player_a_profile?.nickname ?? "Jugador A")
      : (matchSession.player_b_profile?.nickname ?? "Jugador B"),
    opponentNickname: isPlayerA
      ? (matchSession.player_b_profile?.nickname ?? "Rival")
      : (matchSession.player_a_profile?.nickname ?? "Rival"),
    localDeck,
    opponentDeck,
    status: matchSession.status,
  };
}
