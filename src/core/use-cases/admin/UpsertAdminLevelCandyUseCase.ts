// src/core/use-cases/admin/UpsertAdminLevelCandyUseCase.ts - Alta/edición de un caramelo de nivel del mercado.
import { IAdminUpsertLevelCandyCommand } from "@/core/entities/admin/IAdminShopObjects";
import { IAdminShopObjectsRepository } from "@/core/repositories/admin/IAdminShopObjectsRepository";
import {
  assertCandyLevels,
  assertNonEmptyName,
  assertPriceNexus,
  assertShopObjectId,
  normalizeImageUrl,
} from "@/core/use-cases/admin/shop-object-validation";

export class UpsertAdminLevelCandyUseCase {
  constructor(private readonly repository: IAdminShopObjectsRepository) {}

  async execute(command: IAdminUpsertLevelCandyCommand): Promise<void> {
    assertShopObjectId(command.id);
    assertNonEmptyName(command.name);
    assertCandyLevels(command.levels);
    assertPriceNexus(command.priceNexus);
    await this.repository.upsertLevelCandy({
      ...command,
      name: command.name.trim(),
      imageUrl: normalizeImageUrl(command.imageUrl),
    });
  }
}
