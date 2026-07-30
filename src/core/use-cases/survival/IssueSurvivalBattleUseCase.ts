// src/core/use-cases/survival/IssueSurvivalBattleUseCase.ts - Emite una batalla inmutable o reanuda la pendiente.
import { COMBAT_PROOF_PROTOCOL_VERSION } from "@/core/entities/match";
import { ValidationError } from "@/core/errors/ValidationError";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { resolveSurvivalEncounter } from "@/core/services/survival/resolve-survival-encounter";
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

/** Evita reanudar snapshots previos al contrato PvE de cuatro cartas sin afectar otros modos. */
function hasCurrentOpeningContract(snapshot: GameState): boolean {
  return Array.isArray(snapshot.playerA?.hand)
    && snapshot.playerA.hand.length === 4
    && Array.isArray(snapshot.playerB?.hand)
    && snapshot.playerB.hand.length === 4;
}

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
      const nowMs = Date.parse(command.nowIso ?? new Date().toISOString());
      const isReusable = Boolean(
        stored
        && stored.session.protocolVersion === COMBAT_PROOF_PROTOCOL_VERSION
        && Date.parse(stored.session.expiresAtIso) > nowMs
        && hasCurrentOpeningContract(stored.snapshot),
      );
      if (isReusable) return { battle: pendingBattle, resumed: true };
      await this.repository.invalidateIssuedBattle(command.playerId, pendingBattle.battleId);
      run = await this.repository.getActiveRun(command.playerId);
      if (!run) throw new ValidationError("La expedición no se pudo renovar.");
    }
    const configuration = await this.repository.getRuleset(run.rulesetVersion);
    if (!configuration || configuration.ruleset.version !== run.rulesetVersion) {
      throw new ValidationError("El ruleset de la expedición ya no está disponible.");
    }
    const encounter = resolveSurvivalEncounter(
      configuration.ruleset,
      configuration.stages,
      run.currentBattleIndex + 1,
    );
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
}
