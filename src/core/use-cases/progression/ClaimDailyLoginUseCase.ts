// src/core/use-cases/progression/ClaimDailyLoginUseCase.ts - Reclama el login diario delegando en el repositorio (RPC atómica e idempotente).
import { IDailyLoginClaimResult } from "@/core/entities/progression/ILoginStreak";
import { ILoginStreakRepository } from "@/core/repositories/progression/ILoginStreakRepository";

export class ClaimDailyLoginUseCase {
  constructor(private readonly repository: ILoginStreakRepository) {}

  async execute(): Promise<IDailyLoginClaimResult> {
    return this.repository.claim();
  }
}
