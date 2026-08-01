// src/core/use-cases/olympus/CompleteOlympusBattleUseCase.ts - Reproduce el diario reportado: guarda avance o liquida si ya hay desenlace.
import { ICombatProof } from "@/core/entities/match";
import { IOlympusBattle, IOlympusReward, OlympusOutcome } from "@/core/entities/olympus/IOlympus";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { resolveOlympusReward } from "@/core/services/olympus/resolve-olympus-reward";
import { replayCombatProof } from "@/core/use-cases/match/replay-combat-proof";
import { assertJournalExtendsCheckpoint } from "@/core/use-cases/match/internal/assert-journal-extends-checkpoint";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { ValidationError } from "@/core/errors/ValidationError";

type CompleteResult =
  | { settled: false; journalLength: number }
  | {
    settled: true;
    battle: IOlympusBattle;
    outcome: OlympusOutcome;
    reward: IOlympusReward;
    ascensionFragments: number;
    duplicate: boolean;
  };

export class CompleteOlympusBattleUseCase {
  constructor(private readonly repository: IOlympusRepository) {}

  /**
   * Igual que en Supervivencia, el cliente reporta su diario en cada frontera de turno y el servidor
   * decide si eso liquida el combate. El turno de la leyenda lo deriva él, así que dejar de enviar el
   * final no evita la derrota.
   */
  async execute(playerId: string, proof: ICombatProof, nowIso = new Date().toISOString()): Promise<CompleteResult> {
    const [stored, battle] = await Promise.all([
      this.repository.getCombatSession(playerId, proof.battleId),
      this.repository.getBattleById(playerId, proof.battleId),
    ]);
    if (!stored || !battle) throw new ValidationError("El combate no está disponible.");
    if (battle.status === "COMPLETED") {
      if (!battle.outcome || !battle.reward) throw new ValidationError("La liquidación anterior está incompleta.");
      return {
        settled: true,
        battle,
        outcome: battle.outcome,
        reward: battle.reward,
        ascensionFragments: await this.repository.getFragmentBalance(playerId),
        duplicate: true,
      };
    }

    const catalog = await this.repository.getCatalog();
    const legend = catalog.legends.find((candidate) => candidate.id === battle.opponentId);
    if (!legend) throw new ValidationError("La leyenda del combate ya no está disponible.");

    assertJournalExtendsCheckpoint(stored.journalEntries, proof.entries);
    const replay = replayCombatProof({
      session: stored.session,
      proof,
      nowIso,
      initialStateFactory: () => stored.snapshot,
      applyAction: applyMatchAction,
      // El rival lo juega el servidor con el perfil que fijó el catálogo, no el navegador.
      deriveOpponent: { strategy: new HeuristicOpponentStrategy({ difficulty: legend.aiProfile }) },
      allowUnfinished: true,
    });
    if (!replay.winnerPlayerId) {
      const journalLength = await this.repository.saveJournalCheckpoint(playerId, battle.battleId, proof.entries);
      return { settled: false, journalLength };
    }

    const outcome: OlympusOutcome = replay.winnerPlayerId === "DRAW"
      ? "DRAW"
      : replay.winnerPlayerId === playerId ? "WIN" : "LOSS";
    const defeated = await this.repository.getDefeatedLegendIds(playerId);
    const reward = resolveOlympusReward(legend, outcome, defeated.includes(legend.id));
    const settledBattle = await this.repository.completeBattle({
      playerId,
      battleId: battle.battleId,
      outcome,
      reward,
      fragmentAmount: reward.ascensionFragments,
    });
    return {
      settled: true,
      battle: settledBattle,
      outcome,
      reward,
      ascensionFragments: await this.repository.getFragmentBalance(playerId),
      duplicate: false,
    };
  }
}
