// src/core/use-cases/admin/UpsertAdminCardCatalogUseCase.ts - Orquesta validación y persistencia de altas/ediciones de cartas desde admin.
import { IAdminUpsertCardCatalogCommand } from "@/core/entities/admin/IAdminCatalogCommands";
import { IAdminCatalogRepository } from "@/core/repositories/admin/IAdminCatalogRepository";
import { validateAdminCardCommand } from "@/core/services/admin/validate-admin-catalog-commands";

export class UpsertAdminCardCatalogUseCase {
  constructor(private readonly repository: IAdminCatalogRepository) {}

  async execute(command: IAdminUpsertCardCatalogCommand): Promise<void> {
    validateAdminCardCommand(command);
    await this.repository.upsertCard(command);
  }
}
