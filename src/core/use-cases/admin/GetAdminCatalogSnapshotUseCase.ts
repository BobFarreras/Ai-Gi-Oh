// src/core/use-cases/admin/GetAdminCatalogSnapshotUseCase.ts - Recupera snapshot completo de catálogo/mercado para panel administrativo.
import { IAdminCatalogSnapshot } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { buildAdminCatalogSnapshot, IAdminCatalogRepository } from "@/core/repositories/admin/IAdminCatalogRepository";

export class GetAdminCatalogSnapshotUseCase {
  constructor(private readonly repository: IAdminCatalogRepository) {}

  async execute(): Promise<IAdminCatalogSnapshot> {
    return buildAdminCatalogSnapshot(this.repository);
  }
}
