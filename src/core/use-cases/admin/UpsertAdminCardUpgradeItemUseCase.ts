// src/core/use-cases/admin/UpsertAdminCardUpgradeItemUseCase.ts - Alta/edición de un objeto de mejora (ATK/DEF).
import { IAdminUpsertCardUpgradeItemCommand } from "@/core/entities/admin/IAdminShopObjects";
import { IAdminShopObjectsRepository } from "@/core/repositories/admin/IAdminShopObjectsRepository";
import { ValidationError } from "@/core/errors/ValidationError";
import {
  assertNonEmptyName,
  assertPriceNexus,
  assertShopObjectId,
  assertUpgradeValue,
  normalizeImageUrl,
} from "@/core/use-cases/admin/shop-object-validation";

export class UpsertAdminCardUpgradeItemUseCase {
  constructor(private readonly repository: IAdminShopObjectsRepository) {}

  async execute(command: IAdminUpsertCardUpgradeItemCommand): Promise<void> {
    assertShopObjectId(command.id);
    assertNonEmptyName(command.name);
    if (command.stat !== "ATTACK" && command.stat !== "DEFENSE") {
      throw new ValidationError("El atributo de la mejora debe ser ATTACK o DEFENSE.");
    }
    assertUpgradeValue(command.value);
    assertPriceNexus(command.priceNexus);
    await this.repository.upsertCardUpgradeItem({
      ...command,
      name: command.name.trim(),
      imageUrl: normalizeImageUrl(command.imageUrl),
    });
  }
}
