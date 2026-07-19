// src/infrastructure/persistence/supabase/SupabasePlayerInventoryRepository.ts - Entrega objetos (caramelos /
// mejoras) al inventario del jugador. La escritura va SIEMPRE con service-role (patrón de la cartera post-122):
// `player_inventory_items` no es escribible por el jugador, y una RPC de grant ejecutable por `authenticated`
// sería un grifo de objetos gratis desde la consola. El servidor valida el nodo/motivo ANTES de llamar aquí.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { createPrivilegedWriteClientResolver } from "@/infrastructure/persistence/supabase/internal/resolve-privileged-write-client";

export type InventoryItemType = "LEVEL_CANDY" | "CARD_UPGRADE";

export interface IGrantedInventoryItem {
  itemType: InventoryItemType;
  itemId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
}

const CATALOG_TABLE_BY_TYPE: Record<InventoryItemType, string> = {
  LEVEL_CANDY: "level_candies",
  CARD_UPGRADE: "card_upgrade_items",
};

export class SupabasePlayerInventoryRepository {
  private readonly writeClient: () => SupabaseClient;

  constructor(private readonly client: SupabaseClient) {
    this.writeClient = createPrivilegedWriteClientResolver();
  }

  /**
   * Entrega `quantity` copias del objeto al inventario del jugador. Valida contra el catálogo (un id
   * inexistente no se entrega) y devuelve los datos de presentación para el aviso del cliente.
   */
  async grantItem(playerId: string, itemType: InventoryItemType, itemId: string, quantity: number): Promise<IGrantedInventoryItem> {
    const copies = Math.trunc(quantity);
    if (!itemId.trim() || copies < 1 || copies > 10) throw new ValidationError("Entrega de objeto no válida.");

    const { data: catalogRow, error: catalogError } = await this.client
      .from(CATALOG_TABLE_BY_TYPE[itemType])
      .select("id, name, image_url")
      .eq("id", itemId)
      .maybeSingle<{ id: string; name: string; image_url: string | null }>();
    if (catalogError || !catalogRow) throw new ValidationError("El objeto a entregar no existe en el catálogo.");

    // Lectura + upsert con service-role. La idempotencia real la da el candado por nodo del reclamo
    // (interactedNodeIds) aguas arriba, igual que en las recompensas de Nexus/carta de story.
    const { data: existing } = await this.writeClient()
      .from("player_inventory_items")
      .select("quantity")
      .eq("player_id", playerId)
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .maybeSingle<{ quantity: number }>();
    const { error: upsertError } = await this.writeClient()
      .from("player_inventory_items")
      .upsert(
        { player_id: playerId, item_type: itemType, item_id: itemId, quantity: (existing?.quantity ?? 0) + copies },
        { onConflict: "player_id,item_type,item_id" },
      );
    if (upsertError) throw new ValidationError("No se pudo entregar el objeto.");

    return { itemType, itemId, name: catalogRow.name, imageUrl: catalogRow.image_url ?? null, quantity: copies };
  }
}
