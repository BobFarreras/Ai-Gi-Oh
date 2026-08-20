// src/core/use-cases/olympus/ResetOlympusBattleUseCase.ts - Cierra una batalla de Olimpo bloqueada sin consumir otro intento.
import { ValidationError } from "@/core/errors/ValidationError";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";

export class ResetOlympusBattleUseCase {
  constructor(private readonly repository: IOlympusRepository) {}

  /** Cierra exclusivamente la batalla `ISSUED` del jugador y conserva el intento ya contabilizado. */
  async execute(playerId: string) {
    if (!playerId.trim()) throw new ValidationError("No se puede restaurar Olimpo sin un jugador válido.");
    const battle = await this.repository.getIssuedBattle(playerId);
    if (!battle) throw new ValidationError("No hay un combate pendiente de Olimpo que restaurar.");
    const forfeitedBattle = await this.repository.forfeitIssuedBattle(playerId, battle.battleId);
    return { battle: forfeitedBattle, forfeited: true as const };
  }
}
