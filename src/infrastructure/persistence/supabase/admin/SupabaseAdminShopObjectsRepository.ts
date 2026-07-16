// src/infrastructure/persistence/supabase/admin/SupabaseAdminShopObjectsRepository.ts - Persistencia admin de los
// objetos del mercado. Lee TODOS (activos e inactivos) y escribe con el cliente que reciba (service-role en las
// rutas admin; las tablas level_candies/card_upgrade_items solo son escribibles por service_role).
import { SupabaseClient } from "@supabase/supabase-js";
import {
  IAdminCardUpgradeItemEntry,
  IAdminLevelCandyEntry,
  IAdminUpsertCardUpgradeItemCommand,
  IAdminUpsertLevelCandyCommand,
} from "@/core/entities/admin/IAdminShopObjects";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminShopObjectsRepository } from "@/core/repositories/admin/IAdminShopObjectsRepository";

interface ILevelCandyRow {
  id: string;
  name: string;
  levels: number;
  price_nexus: number;
  image_url: string | null;
  is_active: boolean;
}

interface ICardUpgradeItemRow {
  id: string;
  name: string;
  stat: string;
  value: number;
  price_nexus: number;
  image_url: string | null;
  is_active: boolean;
}

function mapCandyRow(row: ILevelCandyRow): IAdminLevelCandyEntry {
  return { id: row.id, name: row.name, levels: row.levels, priceNexus: row.price_nexus, imageUrl: row.image_url, isActive: row.is_active };
}

function mapUpgradeRow(row: ICardUpgradeItemRow): IAdminCardUpgradeItemEntry {
  return {
    id: row.id,
    name: row.name,
    stat: row.stat === "DEFENSE" ? "DEFENSE" : "ATTACK",
    value: row.value,
    priceNexus: row.price_nexus,
    imageUrl: row.image_url,
    isActive: row.is_active,
  };
}

export class SupabaseAdminShopObjectsRepository implements IAdminShopObjectsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listLevelCandies(): Promise<IAdminLevelCandyEntry[]> {
    const { data, error } = await this.client.from("level_candies").select("*").order("levels", { ascending: true });
    if (error) throw new ValidationError("No se pudo leer el catálogo de caramelos.");
    return ((data ?? []) as ILevelCandyRow[]).map(mapCandyRow);
  }

  async listCardUpgradeItems(): Promise<IAdminCardUpgradeItemEntry[]> {
    const { data, error } = await this.client.from("card_upgrade_items").select("*").order("id", { ascending: true });
    if (error) throw new ValidationError("No se pudo leer el catálogo de objetos de mejora.");
    return ((data ?? []) as ICardUpgradeItemRow[]).map(mapUpgradeRow);
  }

  async upsertLevelCandy(command: IAdminUpsertLevelCandyCommand): Promise<void> {
    const { error } = await this.client.from("level_candies").upsert({
      id: command.id,
      name: command.name,
      levels: command.levels,
      price_nexus: command.priceNexus,
      image_url: command.imageUrl,
      is_active: command.isActive,
    });
    if (error) throw new ValidationError("No se pudo guardar el caramelo de nivel.");
  }

  async upsertCardUpgradeItem(command: IAdminUpsertCardUpgradeItemCommand): Promise<void> {
    const { error } = await this.client.from("card_upgrade_items").upsert({
      id: command.id,
      name: command.name,
      stat: command.stat,
      value: command.value,
      price_nexus: command.priceNexus,
      image_url: command.imageUrl,
      is_active: command.isActive,
    });
    if (error) throw new ValidationError("No se pudo guardar el objeto de mejora.");
  }
}
