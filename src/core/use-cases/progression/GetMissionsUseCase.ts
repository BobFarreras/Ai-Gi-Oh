// src/core/use-cases/progression/GetMissionsUseCase.ts - Obtiene las misiones del jugador para el periodo actual.
import { IMissionView } from "@/core/entities/progression/IMission";
import { IMissionRepository } from "@/core/repositories/progression/IMissionRepository";

export class GetMissionsUseCase {
  constructor(private readonly repository: IMissionRepository) {}

  async execute(): Promise<IMissionView[]> {
    return this.repository.getMissions();
  }
}
