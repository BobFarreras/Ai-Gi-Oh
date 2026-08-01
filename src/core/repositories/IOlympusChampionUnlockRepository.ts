// src/core/repositories/IOlympusChampionUnlockRepository.ts - Puerto para conceder campeones de Olimpo al ganar en Arena clásica.
export interface IOlympusChampionUnlockRepository {
  /**
   * Campeones activos de ese tier cuya posición en el ladder ya está superada por las victorias del
   * jugador. El ladder se pelea en orden, así que N victorias equivalen a haber vencido a los N primeros.
   */
  listChampionIdsEarnedInTier(tier: number, tierWins: number): Promise<string[]>;
  /** Concede el campeón de forma idempotente; devuelve `true` solo la primera vez. */
  grantUnlock(playerId: string, championId: string, tier: number, sourceBattleId: string): Promise<boolean>;
}
