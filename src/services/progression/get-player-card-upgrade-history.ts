// src/services/progression/get-player-card-upgrade-history.ts - Historial de objetos aplicados (mejoras ATK/DEF
// y caramelos de nivel) del jugador de la sesión, más reciente primero. Los datos de presentación del objeto se
// resuelven aquí contra los catálogos: un objeto retirado (is_active = false) ya no llega al cliente por la
// tienda, pero su historial debe seguir mostrando nombre e imagen.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export interface IPlayerUpgradeHistoryEntry {
  itemType: "CARD_UPGRADE" | "LEVEL_CANDY";
  itemId: string;
  itemName: string;
  itemImageUrl: string | null;
  cardId: string;
  /** Stat mejorado (solo mejoras; null para caramelos). */
  stat: "ATTACK" | "DEFENSE" | null;
  /** Mejora: bonus aplicado. Caramelo: nivel alcanzado. */
  value: number;
  appliedAtIso: string;
}

interface IUpgradeLogRow {
  item_type: string;
  item_id: string;
  card_id: string;
  stat: string | null;
  value: number;
  applied_at: string;
}

const HISTORY_LIMIT = 100;

export async function getPlayerCardUpgradeHistory(): Promise<IPlayerUpgradeHistoryEntry[]> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return [];
  const client = await createSupabaseServerClient();

  const { data, error } = await client
    .from("player_card_upgrade_log")
    .select("item_type, item_id, card_id, stat, value, applied_at")
    .eq("player_id", session.user.id)
    .order("applied_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (error || !data || data.length === 0) return [];

  const [{ data: upgradeItems }, { data: candyItems }] = await Promise.all([
    client.from("card_upgrade_items").select("id, name, image_url"),
    client.from("level_candies").select("id, name, image_url"),
  ]);
  const itemById = new Map(
    [...(upgradeItems ?? []), ...(candyItems ?? [])].map((row) => [
      row.id as string,
      { name: row.name as string, imageUrl: (row.image_url as string | null) ?? null },
    ]),
  );

  return (data as IUpgradeLogRow[]).map((row) => {
    const item = itemById.get(row.item_id);
    return {
      itemType: row.item_type === "LEVEL_CANDY" ? "LEVEL_CANDY" : "CARD_UPGRADE",
      itemId: row.item_id,
      itemName: item?.name ?? row.item_id,
      itemImageUrl: item?.imageUrl ?? null,
      cardId: row.card_id,
      stat: row.stat === "ATTACK" || row.stat === "DEFENSE" ? row.stat : null,
      value: row.value,
      appliedAtIso: row.applied_at,
    };
  });
}
