// src/core/use-cases/admin/DeleteAdminMarketPackUseCase.ts - Elimina un pack de mercado y su pool asociado tras validar identificador.
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminCatalogRepository } from "@/core/repositories/admin/IAdminCatalogRepository";

export class DeleteAdminMarketPackUseCase {
  constructor(private readonly repository: IAdminCatalogRepository) {}

  async execute(packId: string): Promise<void> {
    const normalized = packId.trim();
    if (normalized.length === 0) throw new ValidationError("Debes indicar el id del pack a eliminar.");
    await this.repository.deletePack(normalized);
  }
}
