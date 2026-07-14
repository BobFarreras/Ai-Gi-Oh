// src/services/market/shop-items.ts - Objetos del mercado (hoy: los caramelos USB Raro).
//
// Los objetos NO son cartas: no tienen ATK/DEF ni se invocan, así que viven en su propio catálogo y en su
// propia pestaña del mercado. El precio y los niveles que concede cada uno salen SIEMPRE del catálogo del
// servidor; del cliente solo llega qué objeto quiere comprar.
import { ValidationError } from "@/core/errors/ValidationError";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export interface IShopItem {
  id: string;
  name: string;
  /** Niveles que concede el caramelo (1-5). */
  levels: number;
  priceNexus: number;
  imageUrl: string | null;
  /** Cuántos tiene ya el jugador en el inventario. */
  owned: number;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Catálogo de objetos a la venta, con la cantidad que ya posee el jugador de cada uno. */
export async function getShopItems(): Promise<IShopItem[]> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return [];
  const client = await createSupabaseServerClient();

  const [{ data: candies }, { data: inventory }] = await Promise.all([
    client.from("level_candies").select("id, name, levels, price_nexus, image_url").eq("is_active", true).order("levels"),
    client.from("player_inventory_items").select("item_id, quantity").eq("player_id", session.user.id).eq("item_type", "LEVEL_CANDY"),
  ]);
  if (!candies) return [];

  const ownedById = new Map((inventory ?? []).map((row) => [row.item_id as string, row.quantity as number]));
  return candies.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    levels: row.levels as number,
    priceNexus: row.price_nexus as number,
    imageUrl: (row.image_url as string | null) ?? null,
    owned: ownedById.get(row.id as string) ?? 0,
  }));
}

export interface IBuyShopItemResult {
  /** Saldo de Nexus tras la compra (lo devuelve la propia transacción). */
  nexus: number;
}

/** Compra un objeto. El cobro y la entrega van en una única transacción SQL, y es idempotente. */
export async function buyShopItem(itemId: string, operationId: string): Promise<IBuyShopItemResult> {
  if (!itemId.trim()) throw new ValidationError("Objeto no válido.");
  if (!UUID_PATTERN.test(operationId)) throw new ValidationError("Operación no válida.");
  const session = await getCurrentUserSession();
  if (!session?.user.id) throw new ValidationError("Sesión no válida.");

  const client = await createSupabaseServerClient();
  const { data, error } = await client.rpc("buy_level_candy", { p_candy_id: itemId, p_operation_id: operationId });
  if (error) throw new ValidationError(error.message);
  return { nexus: typeof data === "number" ? data : 0 };
}
