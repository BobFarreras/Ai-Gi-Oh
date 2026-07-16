// src/core/use-cases/admin/GetAdminShopObjectsUseCase.ts - Lee el snapshot admin de objetos del mercado
// (caramelos + objetos de mejora), incluidos los inactivos, para pintarlos en el panel.
import { IAdminShopObjectsSnapshot } from "@/core/entities/admin/IAdminShopObjects";
import { IAdminShopObjectsRepository } from "@/core/repositories/admin/IAdminShopObjectsRepository";

export class GetAdminShopObjectsUseCase {
  constructor(private readonly repository: IAdminShopObjectsRepository) {}

  async execute(): Promise<IAdminShopObjectsSnapshot> {
    const [candies, upgradeItems] = await Promise.all([
      this.repository.listLevelCandies(),
      this.repository.listCardUpgradeItems(),
    ]);
    return { candies, upgradeItems };
  }
}
