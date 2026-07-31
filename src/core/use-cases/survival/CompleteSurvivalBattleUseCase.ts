// src/core/use-cases/survival/CompleteSurvivalBattleUseCase.ts - Reproduce el diario reportado: guarda avance o liquida si ya hay desenlace.
import { ICombatProof } from "@/core/entities/match";
import { ValidationError } from "@/core/errors/ValidationError";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { resolveSurvivalEncounter } from "@/core/services/survival/resolve-survival-encounter";
import { resolveSurvivalReward } from "@/core/services/survival/resolve-survival-reward";
import { replayCombatProof } from "@/core/use-cases/match/replay-combat-proof";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { assertJournalExtendsCheckpoint } from "./internal/assert-journal-extends-checkpoint";

export class CompleteSurvivalBattleUseCase {
  constructor(private readonly repository: ISurvivalRepository) {}

  /**
   * El cliente reporta su diario en cada frontera de turno y al terminar; el servidor decide cuál de las
   * dos cosas es. Como el turno del rival lo deriva él, un golpe letal aparece al reproducir aunque el
   * cliente no lo haya reportado: abandonar deja de permitir repetir el combate.
   */
  async execute(playerId: string, proof: ICombatProof, nowIso = new Date().toISOString()) {
    const [stored, battle] = await Promise.all([
      this.repository.getCombatSession(playerId, proof.battleId),
      this.repository.getBattleById(playerId, proof.battleId),
    ]);
    if (!stored || !battle) throw new ValidationError("El combate no está disponible.");
    if (battle.status === "COMPLETED") {
      const [run, progress] = await Promise.all([
        this.repository.getRunById(playerId, battle.runId),
        this.repository.getProgress(playerId),
      ]);
      if (!run || !battle.outcome || !battle.reward) {
        throw new ValidationError("La liquidación anterior está incompleta.");
      }
      return {
        settled: true as const,
        run, progress, battle, outcome: battle.outcome,
        reward: battle.reward, duplicate: true,
      };
    }
    const owningRun = await this.repository.getRunById(playerId, battle.runId);
    if (!owningRun) throw new ValidationError("La expedición del combate no está disponible.");
    const configuration = await this.repository.getRuleset(owningRun.rulesetVersion);
    if (!configuration) throw new ValidationError("El ruleset histórico del combate no está disponible.");
    const encounter = resolveSurvivalEncounter(
      configuration.ruleset,
      configuration.stages,
      battle.battleIndex,
    );
    assertJournalExtendsCheckpoint(stored.journalEntries, proof.entries);
    const replay = replayCombatProof({
      session: stored.session,
      proof,
      nowIso,
      initialStateFactory: () => stored.snapshot,
      applyAction: applyMatchAction,
      // El rival lo juega el servidor con el perfil que fijó el ruleset, no el navegador.
      deriveOpponent: { strategy: new HeuristicOpponentStrategy({ difficulty: encounter.aiProfile }) },
      allowUnfinished: true,
    });
    if (!replay.winnerPlayerId) {
      // Avance intermedio: se guarda para que reanudar continúe donde estaba en vez de reiniciar.
      const journalLength = await this.repository.saveJournalCheckpoint(playerId, battle.battleId, proof.entries);
      return { settled: false as const, journalLength };
    }
    const outcome = replay.winnerPlayerId === "DRAW"
      ? "DRAW"
      : replay.winnerPlayerId === playerId ? "WIN" : "LOSS";
    const reward = resolveSurvivalReward(battle, configuration.ruleset, encounter.rewardDefinitionId, outcome);
    const run = await this.repository.completeBattle({
      playerId,
      battleId: battle.battleId,
      outcome,
      endingLp: replay.playerEndingHealthPoints,
      reward,
      fragmentAmount: reward.ascensionFragments,
    });
    const [completedBattle, progress] = await Promise.all([
      this.repository.getBattleById(playerId, battle.battleId),
      this.repository.getProgress(playerId),
    ]);
    if (!completedBattle) throw new ValidationError("La liquidación no se pudo recuperar.");
    return { settled: true as const, run, progress, battle: completedBattle, outcome, reward, duplicate: false };
  }
}
