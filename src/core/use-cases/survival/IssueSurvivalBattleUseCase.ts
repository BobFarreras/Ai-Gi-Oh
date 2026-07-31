// src/core/use-cases/survival/IssueSurvivalBattleUseCase.ts - Emite una batalla inmutable o reanuda la pendiente.
import { COMBAT_PROOF_PROTOCOL_VERSION } from "@/core/entities/match";
import { ValidationError } from "@/core/errors/ValidationError";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { resolveSurvivalEncounter } from "@/core/services/survival/resolve-survival-encounter";
import { resolveIssuedBattleDisposition } from "@/core/services/survival/resolve-issued-battle-disposition";
import { GameState } from "@/core/use-cases/GameEngine";
import { ISurvivalEncounter, ISurvivalRun } from "@/core/entities/survival/ISurvival";

interface IIssueSurvivalBattleCommand {
  playerId: string;
  runId: string;
  battleId: string;
  seed: string;
  expiresAtIso: string;
  nowIso?: string;
}

type SnapshotFactory = (
  run: ISurvivalRun,
  encounter: ISurvivalEncounter,
  seed: string,
) => Promise<{ snapshot: GameState; snapshotHash: string }>;

export class IssueSurvivalBattleUseCase {
  constructor(
    private readonly repository: ISurvivalRepository,
    private readonly snapshotFactory: SnapshotFactory,
  ) {}

  /** Fija rival, tier y Ascensión server-side antes de persistir el snapshot de replay. */
  async execute(command: IIssueSurvivalBattleCommand) {
    let run = await this.repository.getActiveRun(command.playerId);
    if (!run || run.id !== command.runId) throw new ValidationError("La expedición no está activa.");
    const pendingBattle = await this.repository.getIssuedBattle(run.id);
    if (pendingBattle) {
      const stored = await this.repository.getCombatSession(command.playerId, pendingBattle.battleId);
      const disposition = resolveIssuedBattleDisposition({
        session: stored?.session ?? null,
        snapshot: stored?.snapshot ?? null,
        nowIso: command.nowIso ?? new Date().toISOString(),
        expectedProtocolVersion: COMBAT_PROOF_PROTOCOL_VERSION,
      });
      if (disposition === "RESUME") {
        // El encuentro viaja también al reanudar: el cliente necesita el mismo perfil de IA que
        // usará el servidor al reproducir, o el replay divergiría.
        const resumedEncounter = await this.resolveEncounterFor(run, pendingBattle.battleIndex);
        return { battle: pendingBattle, encounter: resumedEncounter, resumed: true };
      }
      if (disposition === "FORFEIT") {
        // Defensa en profundidad: el cierre normal ocurre al iniciar la expedición, no aquí.
        await this.repository.forfeitIssuedBattle(command.playerId, pendingBattle.battleId);
        throw new ValidationError("La expedición terminó por abandonar un combate; inicia una nueva.");
      }
      await this.repository.invalidateIssuedBattle(command.playerId, pendingBattle.battleId);
      run = await this.repository.getActiveRun(command.playerId);
      if (!run) throw new ValidationError("La expedición no se pudo renovar.");
    }
    const encounter = await this.resolveEncounterFor(run, run.currentBattleIndex + 1);
    const prepared = await this.snapshotFactory(run, encounter, command.seed);
    if (prepared.snapshot.playerB.id !== encounter.opponentId || prepared.snapshot.playerA.id !== command.playerId) {
      throw new ValidationError("El snapshot no coincide con el encuentro resuelto.");
    }
    const battle = await this.repository.issueBattle({
      ...command,
      ...prepared,
      opponentId: encounter.opponentId,
      effectiveTier: encounter.effectiveTier,
      ascensionRank: encounter.ascensionRank,
      protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION,
    });
    return { battle, encounter, resumed: false };
  }

  /** Resuelve el encuentro contra el ruleset histórico fijado por la expedición. */
  private async resolveEncounterFor(run: ISurvivalRun, battleIndex: number): Promise<ISurvivalEncounter> {
    const configuration = await this.repository.getRuleset(run.rulesetVersion);
    if (!configuration || configuration.ruleset.version !== run.rulesetVersion) {
      throw new ValidationError("El ruleset de la expedición ya no está disponible.");
    }
    return resolveSurvivalEncounter(configuration.ruleset, configuration.stages, battleIndex);
  }
}
