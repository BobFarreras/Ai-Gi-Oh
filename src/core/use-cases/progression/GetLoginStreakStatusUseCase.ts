// src/core/use-cases/progression/GetLoginStreakStatusUseCase.ts - Obtiene el estado de la racha de login del jugador.
import { ILoginStreakStatus } from "@/core/entities/progression/ILoginStreak";
import { ILoginStreakRepository } from "@/core/repositories/progression/ILoginStreakRepository";

export class GetLoginStreakStatusUseCase {
  constructor(private readonly repository: ILoginStreakRepository) {}

  async execute(): Promise<ILoginStreakStatus> {
    return this.repository.getStatus();
  }
}
