// src/core/use-cases/admin/UpsertAdminMarketPackUseCase.ts - Aplica alta/edición de pack y reemplazo determinista de su pool de cartas.
import { IAdminUpsertMarketPackCommand } from "@/core/entities/admin/IAdminCatalogCommands";
import { IAdminCatalogRepository } from "@/core/repositories/admin/IAdminCatalogRepository";
import { validateAdminPackCommand } from "@/core/services/admin/validate-admin-catalog-commands";

export class UpsertAdminMarketPackUseCase {
  constructor(private readonly repository: IAdminCatalogRepository) {}

  async execute(command: IAdminUpsertMarketPackCommand): Promise<void> {
    validateAdminPackCommand(command);
    await this.repository.upsertPack(command);
    await this.repository.replacePackPoolEntries(command.packPoolId, command.poolEntries);
  }
}
