// src/core/use-cases/admin/UpsertAdminMarketListingUseCase.ts - Ejecuta validación y upsert de listados de cartas en mercado admin.
import { IAdminUpsertMarketListingCommand } from "@/core/entities/admin/IAdminCatalogCommands";
import { IAdminCatalogRepository } from "@/core/repositories/admin/IAdminCatalogRepository";
import { validateAdminListingCommand } from "@/core/services/admin/validate-admin-catalog-commands";

export class UpsertAdminMarketListingUseCase {
  constructor(private readonly repository: IAdminCatalogRepository) {}

  async execute(command: IAdminUpsertMarketListingCommand): Promise<void> {
    validateAdminListingCommand(command);
    await this.repository.upsertListing(command);
  }
}
