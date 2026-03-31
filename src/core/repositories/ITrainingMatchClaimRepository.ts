// src/core/repositories/ITrainingMatchClaimRepository.ts - Contrato de idempotencia para registrar cierre único por batalla de entrenamiento.
export interface ITrainingMatchClaimRepository {
  tryReserveMatch(playerId: string, battleId: string, tier: number): Promise<boolean>;
}
