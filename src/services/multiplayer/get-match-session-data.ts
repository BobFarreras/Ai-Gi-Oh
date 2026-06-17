// src/services/multiplayer/get-match-session-data.ts - Carga server-side de la sesión de partida, perfiles y mazos con progresión de ambos jugadores.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { SupabasePlayerCardProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerCardProgressRepository";
import { ICard } from "@/core/entities/ICard";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";

interface IMatchSessionRow {
  id: string;
  player_a_id: string;
  player_b_id: string;
  deck_a_ids: string[];
  deck_b_ids: string[];
  seed: string;
  status: string;
}

interface IProfileRow {
  player_id: string;
  nickname: string;
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
  const localPlayerId = session.user.id;

  // Service role: necesario para leer el perfil y la progresión del RIVAL, que
  // RLS restringe a (auth.uid() = player_id). Solo se expone tras verificar que
  // el usuario es participante de la partida.
  const supabase = createSupabaseServiceRoleClient();

  const { data: matchSession } = await supabase
    .from("match_sessions")
    .select("id, player_a_id, player_b_id, deck_a_ids, deck_b_ids, seed, status")
    .eq("id", matchId)
    .single<IMatchSessionRow>();

  if (!matchSession) return null;

  const isPlayerA = matchSession.player_a_id === localPlayerId;
  if (!isPlayerA && matchSession.player_b_id !== localPlayerId) return null;

  const opponentId = isPlayerA ? matchSession.player_b_id : matchSession.player_a_id;
  const localDeckIds = isPlayerA ? matchSession.deck_a_ids : matchSession.deck_b_ids;
  const opponentDeckIds = isPlayerA ? matchSession.deck_b_ids : matchSession.deck_a_ids;

  // Perfiles (nicknames) de ambos jugadores.
  const { data: profileRows } = await supabase
    .from("player_profiles")
    .select("player_id, nickname")
    .in("player_id", [localPlayerId, opponentId]);
  const nicknameById = new Map((profileRows as IProfileRow[] | null)?.map((p) => [p.player_id, p.nickname]) ?? []);

  // Progresión por carta de cada jugador para reflejar su mazo real (niveles/versiones).
  const progressRepository = new SupabasePlayerCardProgressRepository(supabase);
  const [localProgress, opponentProgress] = await Promise.all([
    progressRepository.listByPlayer(localPlayerId),
    progressRepository.listByPlayer(opponentId),
  ]);
  const localProgressByCardId = new Map(localProgress.map((p) => [p.cardId, p]));
  const opponentProgressByCardId = new Map(opponentProgress.map((p) => [p.cardId, p]));

  // Las cartas viven en el catálogo en código; se les aplica la progresión del propietario.
  const resolveDeck = (ids: string[], progressByCardId: typeof localProgressByCardId): ICard[] =>
    ids
      .map((id) => {
        const base = CARD_BY_ID.get(id);
        if (!base) return null;
        return applyCardProgressionToCard(base, progressByCardId.get(id) ?? null);
      })
      .filter((c): c is ICard => c !== null);

  const localDeck = resolveDeck(localDeckIds, localProgressByCardId);
  const opponentDeck = resolveDeck(opponentDeckIds, opponentProgressByCardId);

  return {
    matchId,
    seed: matchSession.seed,
    localPlayerId,
    opponentId,
    isPlayerA,
    localNickname: nicknameById.get(localPlayerId) ?? "Tú",
    opponentNickname: nicknameById.get(opponentId) ?? "Rival",
    localDeck,
    opponentDeck,
    status: matchSession.status,
  };
}
