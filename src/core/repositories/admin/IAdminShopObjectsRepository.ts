// src/core/repositories/admin/IAdminShopObjectsRepository.ts - Contrato de persistencia del CRUD admin de objetos
// del mercado. La lectura incluye también los inactivos (el admin los ve para reactivarlos); la escritura la hace
// siempre el service-role (las tablas no son escribibles por el jugador).
import {
  IAdminCardUpgradeItemEntry,
  IAdminLevelCandyEntry,
  IAdminUpsertCardUpgradeItemCommand,
  IAdminUpsertLevelCandyCommand,
} from "@/core/entities/admin/IAdminShopObjects";

export interface IAdminShopObjectsRepository {
  listLevelCandies(): Promise<IAdminLevelCandyEntry[]>;
  listCardUpgradeItems(): Promise<IAdminCardUpgradeItemEntry[]>;
  upsertLevelCandy(command: IAdminUpsertLevelCandyCommand): Promise<void>;
  upsertCardUpgradeItem(command: IAdminUpsertCardUpgradeItemCommand): Promise<void>;
}
