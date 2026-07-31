// src/core/use-cases/survival/StartSurvivalRunUseCase.ts - Inicia o reanuda una única expedición activa cerrando la abandonada.
import { COMBAT_PROOF_PROTOCOL_VERSION } from "@/core/entities/match";
import { ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { ValidationError } from "@/core/errors/ValidationError";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { resolveIssuedBattleDisposition } from "@/core/services/survival/resolve-issued-battle-disposition";

export class StartSurvivalRunUseCase {
  constructor(private readonly repository: ISurvivalRepository) {}

  /** Reutiliza la run activa para que retries o dobles clics no creen expediciones duplicadas. */
  async execute(playerId: string, maxLp: number, nowIso = new Date().toISOString()) {
    if (!playerId.trim() || !Number.isInteger(maxLp) || maxLp < 1) {
      throw new ValidationError("No se puede iniciar una expedición con datos inválidos.");
    }
    const existing = await this.repository.getActiveRun(playerId);
    const forfeitedPreviousRun = existing ? await this.forfeitAbandonedBattle(playerId, existing, nowIso) : false;
    if (existing && !forfeitedPreviousRun) {
      const [progress, configuration] = await Promise.all([
        this.repository.getProgress(playerId),
        this.repository.getRuleset(existing.rulesetVersion),
      ]);
      if (!configuration) throw new ValidationError("El ruleset de la expedición ya no está disponible.");
      return {
        run: existing,
        progress,
        resumed: true,
        forfeitedPreviousRun: false,
        milestoneInterval: configuration.ruleset.milestoneInterval,
      };
    }
    const configuration = await this.repository.getRuleset();
    if (!configuration) throw new ValidationError("Supervivencia no tiene un ruleset activo.");
    const run = await this.repository.startRun(playerId, maxLp, configuration.ruleset.version);
    const progress = await this.repository.getProgress(playerId);
    // El intervalo de curación viaja al cliente: la UI no debe fijar por su cuenta una regla del ruleset.
    return {
      run,
      progress,
      resumed: false,
      forfeitedPreviousRun,
      milestoneInterval: configuration.ruleset.milestoneInterval,
    };
  }

  /**
   * Abandonar un combate jugable deja de ser gratis: si su sesión caducó sin liquidarse se registra
   * como derrota. Así reanudar tras perder no permite repetir el mismo snapshot indefinidamente.
   */
  private async forfeitAbandonedBattle(playerId: string, run: ISurvivalRun, nowIso: string): Promise<boolean> {
    const pendingBattle = await this.repository.getIssuedBattle(run.id);
    if (!pendingBattle) return false;
    const stored = await this.repository.getCombatSession(playerId, pendingBattle.battleId);
    const disposition = resolveIssuedBattleDisposition({
      session: stored?.session ?? null,
      snapshot: stored?.snapshot ?? null,
      nowIso,
      expectedProtocolVersion: COMBAT_PROOF_PROTOCOL_VERSION,
    });
    if (disposition !== "FORFEIT") return false;
    await this.repository.forfeitIssuedBattle(playerId, pendingBattle.battleId);
    return true;
  }
}
