// src/core/use-cases/survival/ResetSurvivalRunUseCase.ts - Cierra una expedición bloqueada y crea otra de forma autoritativa.
import { ValidationError } from "@/core/errors/ValidationError";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";

export class ResetSurvivalRunUseCase {
  constructor(private readonly repository: ISurvivalRepository) {}

  /** Reinicia la expedición activa sin esperar a que caduque el combate emitido. */
  async execute(playerId: string, maxLp: number) {
    if (!playerId.trim() || !Number.isInteger(maxLp) || maxLp < 1) {
      throw new ValidationError("No se puede reiniciar una expedición con datos inválidos.");
    }
    const activeRun = await this.repository.getActiveRun(playerId);
    if (activeRun) {
      const issuedBattle = await this.repository.getIssuedBattle(activeRun.id);
      if (!issuedBattle) {
        throw new ValidationError("La expedición activa no tiene un combate que se pueda restaurar.");
      }
      await this.repository.forfeitIssuedBattle(playerId, issuedBattle.battleId);
    }
    const configuration = await this.repository.getRuleset();
    if (!configuration) throw new ValidationError("Supervivencia no tiene un ruleset activo.");
    const run = await this.repository.startRun(playerId, maxLp, configuration.ruleset.version);
    const progress = await this.repository.getProgress(playerId);
    return {
      run,
      progress,
      resumed: false,
      forfeitedPreviousRun: Boolean(activeRun),
      milestoneInterval: configuration.ruleset.milestoneInterval,
      milestoneHeal: configuration.ruleset.milestoneHeal,
    };
  }
}
