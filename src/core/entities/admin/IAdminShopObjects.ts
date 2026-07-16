// src/core/entities/admin/IAdminShopObjects.ts - Entidades y comandos del CRUD admin de objetos del mercado
// (caramelos de nivel `level_candies` y objetos de mejora `card_upgrade_items`). No son cartas: viven en sus
// propios catálogos y se editan aquí. El precio/valor son la fuente de la verdad que consume el mercado.
import { CardUpgradeStat } from "@/core/services/progression/card-upgrade-rules";

export interface IAdminLevelCandyEntry {
  id: string;
  name: string;
  /** Niveles que concede (1-5). */
  levels: number;
  priceNexus: number;
  imageUrl: string | null;
  isActive: boolean;
}

export interface IAdminCardUpgradeItemEntry {
  id: string;
  name: string;
  stat: CardUpgradeStat;
  /** ATK/DEF permanente que aporta (> 0). */
  value: number;
  priceNexus: number;
  imageUrl: string | null;
  isActive: boolean;
}

export interface IAdminShopObjectsSnapshot {
  candies: IAdminLevelCandyEntry[];
  upgradeItems: IAdminCardUpgradeItemEntry[];
}

export type IAdminUpsertLevelCandyCommand = IAdminLevelCandyEntry;
export type IAdminUpsertCardUpgradeItemCommand = IAdminCardUpgradeItemEntry;
