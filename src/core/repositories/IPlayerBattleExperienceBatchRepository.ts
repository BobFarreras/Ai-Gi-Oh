// src/core/repositories/IPlayerBattleExperienceBatchRepository.ts - Contrato para idempotencia de persistencia de EXP por batalla.
export interface IPlayerBattleExperienceBatchRepository {
  tryReserveBatch(playerId: string, battleId: string, eventsCount: number): Promise<boolean>;
}

