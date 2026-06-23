// src/core/use-cases/progression/admin/UpsertMissionUseCase.ts - Valida y persiste una definición de misión desde el panel admin.
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminMissionDefinition } from "@/core/entities/progression/ILiveOpsAdmin";
import { IProgressionAdminRepository } from "@/core/repositories/progression/IProgressionAdminRepository";

const VALID_SCOPES = new Set(["DAILY", "WEEKLY"]);

export class UpsertMissionUseCase {
  constructor(private readonly repository: IProgressionAdminRepository) {}

  async execute(mission: IAdminMissionDefinition): Promise<void> {
    if (!mission.id.trim()) throw new ValidationError("El id de la misión es obligatorio.");
    if (!VALID_SCOPES.has(mission.scope)) throw new ValidationError("Scope de misión inválido.");
    if (!mission.objectiveType.trim()) throw new ValidationError("El objetivo de la misión es obligatorio.");
    if (!Number.isInteger(mission.targetCount) || mission.targetCount <= 0) {
      throw new ValidationError("La cantidad objetivo debe ser un entero positivo.");
    }
    if (!Number.isInteger(mission.rewardNexus) || mission.rewardNexus < 0) {
      throw new ValidationError("La recompensa Nexus debe ser un entero no negativo.");
    }
    if (!mission.title.trim()) throw new ValidationError("El título de la misión es obligatorio.");
    await this.repository.upsertMission(mission);
  }
}
