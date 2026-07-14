// src/infrastructure/persistence/supabase/internal/card-catalog-row.ts - Tipos de fila para hidratar cartas desde cards_catalog.
import { CardArchetype, CardType, Faction, TrapTrigger } from "@/core/entities/ICard";

export interface ICardCatalogRow {
  id: string;
  name: string;
  description: string;
  type: CardType;
  faction: Faction;
  cost: number;
  attack: number | null;
  defense: number | null;
  archetype: CardArchetype | null;
  trigger: TrapTrigger | null;
  bg_url: string | null;
  render_url: string | null;
  /** Arte alternativo al llegar al nivel máximo; null mientras no exista la imagen (cae al render normal). */
  render_url_max_level: string | null;
  effect: unknown;
  fusion_recipe_id: string | null;
  fusion_material_ids: string[];
  fusion_energy_requirement: number | null;
  /** Pasiva mastery activa desde V1 (poder innato); null en cartas normales. */
  innate_passive_skill_id: string | null;
}

export const CARD_CATALOG_SELECT =
  "id,name,description,type,faction,cost,attack,defense,archetype,trigger,bg_url,render_url,render_url_max_level,effect,fusion_recipe_id,fusion_material_ids,fusion_energy_requirement,innate_passive_skill_id";
