// src/core/use-cases/survival/CompleteSurvivalBattleUseCase.ts - Liquida replay, LP y Fragmentos de forma autoritativa.
import { ICombatProof } from "@/core/entities/match";
import { ValidationError } from "@/core/errors/ValidationError";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { resolveSurvivalEncounter } from "@/core/services/survival/resolve-survival-encounter";
import { resolveSurvivalReward } from "@/core/services/survival/resolve-survival-reward";
import { replayCombatProof } from "@/core/use-cases/match/replay-combat-proof";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";

export class CompleteSurvivalBattleUseCase {
  constructor(private readonly repository: ISurvivalRepository) {}

  /** Reproduce la prueba y deriva resultado, LP y recompensa sin aceptar esos valores del body. */
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
    const replay = replayCombatProof({
      session: stored.session,
      proof,
      nowIso,
      initialStateFactory: () => stored.snapshot,
      applyAction: applyMatchAction,
      // El rival lo juega el servidor con el perfil que fijó el ruleset, no el navegador.
      deriveOpponent: { strategy: new HeuristicOpponentStrategy({ difficulty: encounter.aiProfile }) },
    });
    const outcome = replay.winnerPlayerId === "DRAW"
      ? "DRAW"
      : replay.winnerPlayerId === playerId ? "WIN" : "LOSS";
    const reward = resolveSurvivalReward(battle, configuration.ruleset, encounter.rewardDefinitionId, outcome);
    const run = await this.repository.completeBattle({
      playerId,
      battleId: battle.battleId,
      outcome,
      endingLp: replay.playerEndingHealthPoints,
      reward: reward as unknown as Record<string, unknown>,
      fragmentAmount: reward.ascensionFragments,
    });
    const [completedBattle, progress] = await Promise.all([
      this.repository.getBattleById(playerId, battle.battleId),
      this.repository.getProgress(playerId),
    ]);
    if (!completedBattle) throw new ValidationError("La liquidación no se pudo recuperar.");
    return { run, progress, battle: completedBattle, outcome, reward, duplicate: false };
  }
}
