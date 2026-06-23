// src/core/use-cases/progression/ClaimMissionRewardUseCase.ts - Reclama la recompensa de una misión completada.
import { ValidationError } from "@/core/errors/ValidationError";
import { IMissionClaimResult } from "@/core/entities/progression/IMission";
import { IMissionRepository } from "@/core/repositories/progression/IMissionRepository";

export class ClaimMissionRewardUseCase {
  constructor(private readonly repository: IMissionRepository) {}

  async execute(missionId: string, periodKey: string): Promise<IMissionClaimResult> {
    if (!missionId.trim() || !periodKey.trim()) {
      throw new ValidationError("Misión y periodo son obligatorios para reclamar.");
    }
    return this.repository.claim(missionId, periodKey);
  }
}
