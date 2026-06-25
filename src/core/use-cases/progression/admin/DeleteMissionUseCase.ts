// src/core/use-cases/progression/admin/DeleteMissionUseCase.ts - Valida y elimina una definición de misión desde el panel admin.
import { ValidationError } from "@/core/errors/ValidationError";
import { IProgressionAdminRepository } from "@/core/repositories/progression/IProgressionAdminRepository";

export class DeleteMissionUseCase {
  constructor(private readonly repository: IProgressionAdminRepository) {}

  async execute(id: string): Promise<void> {
    if (!id.trim()) throw new ValidationError("El id de la misión es obligatorio.");
    await this.repository.deleteMission(id);
  }
}
