// src/services/market/shop-items.ts - Objetos del mercado: caramelos de nivel (USB Raro) y objetos de mejora
// permanente de ATK/DEF (Núcleo Overclock / Placa Blindada).
//
// Los objetos NO son cartas: no tienen ATK/DEF propios ni se invocan, así que viven en sus catálogos y en su
// propia sección del mercado. El precio y los valores salen SIEMPRE del catálogo del servidor; del cliente solo
// llega qué objeto quiere comprar (y sobre qué carta, al aplicar una mejora).
import { ValidationError } from "@/core/errors/ValidationError";
import { CardUpgradeStat } from "@/core/services/progression/card-upgrade-rules";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export interface IShopCandyItem {
  id: string;
  name: string;
  /** Niveles que concede el caramelo (1-5). */
  levels: number;
  priceNexus: number;
  imageUrl: string | null;
  owned: number;
}

export interface IShopUpgradeItem {
  id: string;
  name: string;
  stat: CardUpgradeStat;
  /** Cuánto ATK/DEF permanente aporta. */
  value: number;
  priceNexus: number;
  imageUrl: string | null;
  owned: number;
}

export interface IShopItems {
  candies: IShopCandyItem[];
  upgrades: IShopUpgradeItem[];
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Catálogo de objetos a la venta, con lo que ya posee el jugador de cada uno. */
export async function getShopItems(): Promise<IShopItems> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return { candies: [], upgrades: [] };
  const client = await createSupabaseServerClient();

  const [{ data: candies }, { data: upgrades }, { data: inventory }] = await Promise.all([
    client.from("level_candies").select("id, name, levels, price_nexus, image_url").eq("is_active", true).order("levels"),
    client.from("card_upgrade_items").select("id, name, stat, value, price_nexus, image_url").eq("is_active", true).order("stat"),
    client.from("player_inventory_items").select("item_id, quantity").eq("player_id", session.user.id),
  ]);

  const ownedById = new Map((inventory ?? []).map((row) => [row.item_id as string, row.quantity as number]));
  return {
    candies: (candies ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      levels: row.levels as number,
      priceNexus: row.price_nexus as number,
      imageUrl: (row.image_url as string | null) ?? null,
      owned: ownedById.get(row.id as string) ?? 0,
    })),
    upgrades: (upgrades ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      stat: row.stat === "DEFENSE" ? "DEFENSE" : "ATTACK",
      value: row.value as number,
      priceNexus: row.price_nexus as number,
      imageUrl: (row.image_url as string | null) ?? null,
      owned: ownedById.get(row.id as string) ?? 0,
    })),
  };
}

export interface IBuyShopItemResult {
  /** Saldo de Nexus tras la compra (lo devuelve la propia transacción). */
  nexus: number;
}

function assertOperationId(operationId: string): void {
  if (!UUID_PATTERN.test(operationId)) throw new ValidationError("Operación no válida.");
}

async function requireSessionClient() {
  const session = await getCurrentUserSession();
  if (!session?.user.id) throw new ValidationError("Sesión no válida.");
  return createSupabaseServerClient();
}

/** Compra un caramelo. Cobro + entrega en una transacción SQL idempotente. */
export async function buyCandy(itemId: string, operationId: string): Promise<IBuyShopItemResult> {
  if (!itemId.trim()) throw new ValidationError("Objeto no válido.");
  assertOperationId(operationId);
  const client = await requireSessionClient();
  const { data, error } = await client.rpc("buy_level_candy", { p_candy_id: itemId, p_operation_id: operationId });
  if (error) throw new ValidationError(error.message);
  return { nexus: typeof data === "number" ? data : 0 };
}

/** Compra un objeto de mejora (ATK/DEF). Cobro + entrega en una transacción SQL idempotente. */
export async function buyUpgradeItem(itemId: string, operationId: string): Promise<IBuyShopItemResult> {
  if (!itemId.trim()) throw new ValidationError("Objeto no válido.");
  assertOperationId(operationId);
  const client = await requireSessionClient();
  const { data, error } = await client.rpc("buy_card_upgrade_item", { p_item_id: itemId, p_operation_id: operationId });
  if (error) throw new ValidationError(error.message);
  return { nexus: typeof data === "number" ? data : 0 };
}

/** Aplica un objeto de mejora a una carta. El tope lo valida la RPC (server-authoritative). */
export async function applyUpgradeItem(itemId: string, cardId: string, operationId: string): Promise<void> {
  if (!itemId.trim() || !cardId.trim()) throw new ValidationError("Objeto o carta no válidos.");
  assertOperationId(operationId);
  const client = await requireSessionClient();
  const { error } = await client.rpc("apply_card_upgrade", { p_item_id: itemId, p_card_id: cardId, p_operation_id: operationId });
  if (error) throw new ValidationError(error.message);
}
