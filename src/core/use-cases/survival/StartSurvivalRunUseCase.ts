// src/core/use-cases/survival/StartSurvivalRunUseCase.ts - Inicia o reanuda una única expedición activa.
import { ValidationError } from "@/core/errors/ValidationError";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";

export class StartSurvivalRunUseCase {
  constructor(private readonly repository: ISurvivalRepository) {}

  /** Reutiliza la run activa para que retries o dobles clics no creen expediciones duplicadas. */
  async execute(playerId: string, maxLp: number) {
    if (!playerId.trim() || !Number.isInteger(maxLp) || maxLp < 1) {
      throw new ValidationError("No se puede iniciar una expedición con datos inválidos.");
    }
    const existing = await this.repository.getActiveRun(playerId);
    if (existing) {
      const progress = await this.repository.getProgress(playerId);
      return { run: existing, progress, resumed: true };
    }
    const configuration = await this.repository.getRuleset();
    if (!configuration) throw new ValidationError("Supervivencia no tiene un ruleset activo.");
    const run = await this.repository.startRun(playerId, maxLp, configuration.ruleset.version);
    const progress = await this.repository.getProgress(playerId);
    return { run, progress, resumed: false };
  }
}
