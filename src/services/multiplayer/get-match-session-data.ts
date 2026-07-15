// src/services/multiplayer/get-match-session-data.ts - Carga server-side de la sesión de partida, perfiles y mazos con progresión de ambos jugadores.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { SupabasePlayerCardProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerCardProgressRepository";
import { SupabasePlayerCardUpgradesRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerCardUpgradesRepository";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { ICard } from "@/core/entities/ICard";
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

interface IFusionSlotRow {
  player_id: string;
  slot_index: number;
  card_id: string | null;
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
  localFusionDeck: ICard[];
  opponentFusionDeck: ICard[];
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

  // Mazos de fusión (2 cartas por jugador) desde player_fusion_deck_slots.
  const { data: fusionSlotRows } = await supabase
    .from("player_fusion_deck_slots")
    .select("player_id, slot_index, card_id")
    .in("player_id", [localPlayerId, opponentId])
    .order("slot_index", { ascending: true });
  const fusionIdsByPlayer = new Map<string, string[]>();
  for (const row of (fusionSlotRows as IFusionSlotRow[] | null) ?? []) {
    if (!row.card_id) continue;
    const list = fusionIdsByPlayer.get(row.player_id) ?? [];
    list.push(row.card_id);
    fusionIdsByPlayer.set(row.player_id, list);
  }
  const localFusionIds = fusionIdsByPlayer.get(localPlayerId) ?? [];
  const opponentFusionIds = fusionIdsByPlayer.get(opponentId) ?? [];

  // Perfiles (nicknames) de ambos jugadores.
  const { data: profileRows } = await supabase
    .from("player_profiles")
    .select("player_id, nickname")
    .in("player_id", [localPlayerId, opponentId]);
  const nicknameById = new Map((profileRows as IProfileRow[] | null)?.map((p) => [p.player_id, p.nickname]) ?? []);

  // Progresión y mejoras (objetos ATK/DEF) por carta de cada jugador, para reflejar su mazo REAL. Los dos mazos
  // se resuelven aquí con los mismos datos, así que ambos clientes ven idénticos números sin tocar el transporte.
  const progressRepository = new SupabasePlayerCardProgressRepository(supabase);
  const upgradesRepository = new SupabasePlayerCardUpgradesRepository(supabase);
  const [localProgress, opponentProgress, localUpgradesByCardId, opponentUpgradesByCardId] = await Promise.all([
    progressRepository.listByPlayer(localPlayerId),
    progressRepository.listByPlayer(opponentId),
    upgradesRepository.getUpgradesByPlayer(localPlayerId),
    upgradesRepository.getUpgradesByPlayer(opponentId),
  ]);
  const localProgressByCardId = new Map(localProgress.map((p) => [p.cardId, p]));
  const opponentProgressByCardId = new Map(opponentProgress.map((p) => [p.cardId, p]));

  // Resolver las cartas desde el catálogo de la DB (cards_catalog), que es la
  // fuente real de los mazos. El catálogo en código no contiene todas las cartas,
  // lo que truncaba el mazo (p. ej. 11 vs 4 cartas). Luego se aplica la progresión.
  const allCardIds = [...new Set([...localDeckIds, ...opponentDeckIds, ...localFusionIds, ...opponentFusionIds])];
  const cardById = await loadCardsByIds(supabase, allCardIds, { onlyActive: false });

  const resolveDeck = (
    ids: string[],
    progressByCardId: typeof localProgressByCardId,
    upgradesByCardId: typeof localUpgradesByCardId,
  ): ICard[] =>
    ids
      .map((id) => {
        const base = cardById.get(id);
        if (!base) return null;
        return applyCardProgressionToCard(base, progressByCardId.get(id) ?? null, upgradesByCardId.get(id));
      })
      .filter((c): c is ICard => c !== null);

  const localDeck = resolveDeck(localDeckIds, localProgressByCardId, localUpgradesByCardId);
  const opponentDeck = resolveDeck(opponentDeckIds, opponentProgressByCardId, opponentUpgradesByCardId);
  const localFusionDeck = resolveDeck(localFusionIds, localProgressByCardId, localUpgradesByCardId);
  const opponentFusionDeck = resolveDeck(opponentFusionIds, opponentProgressByCardId, opponentUpgradesByCardId);

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
    localFusionDeck,
    opponentFusionDeck,
    status: matchSession.status,
  };
}
