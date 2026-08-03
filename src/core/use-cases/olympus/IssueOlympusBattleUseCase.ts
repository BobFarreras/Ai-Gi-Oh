// src/core/use-cases/olympus/IssueOlympusBattleUseCase.ts - Emite una batalla legendaria inmutable o reanuda la pendiente.
import { COMBAT_PROOF_PROTOCOL_VERSION } from "@/core/entities/match";
import {
  IOlympusBattle,
  IOlympusChampion,
  IOlympusLegend,
  IOlympusUpgradeNode,
} from "@/core/entities/olympus/IOlympus";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { resolveIssuedBattleDisposition } from "@/core/services/match/resolve-issued-battle-disposition";
import { ValidationError } from "@/core/errors/ValidationError";
import { GameState } from "@/core/use-cases/GameEngine";

interface IIssueOlympusBattleCommand {
  playerId: string;
  championId: string;
  opponentId: string;
  battleId: string;
  seed: string;
  nowIso?: string;
}

interface IPreparedSnapshot {
  snapshot: GameState;
  snapshotHash: string;
  championSnapshotHash: string;
  opponentSnapshotHash: string;
}

type SnapshotFactory = (
  champion: IOlympusChampion,
  legend: IOlympusLegend,
  nodes: IOlympusUpgradeNode[],
  nodeRanks: Record<string, number>,
  seed: string,
) => Promise<IPreparedSnapshot>;

export interface IIssueOlympusBattleResult {
  battle: IOlympusBattle;
  champion: IOlympusChampion;
  legend: IOlympusLegend;
  resumed: boolean;
  /** El cliente debe animar con el mismo perfil que el servidor usará al reproducir. */
  aiProfile: IOlympusLegend["aiProfile"];
  battleTtlMinutes: number;
}

export class IssueOlympusBattleUseCase {
  constructor(
    private readonly repository: IOlympusRepository,
    private readonly snapshotFactory: SnapshotFactory,
  ) {}

  /** El intento se consume en la RPC al emitir; reanudar una batalla ya emitida no cuesta otro. */
  async execute(command: IIssueOlympusBattleCommand): Promise<IIssueOlympusBattleResult> {
    const catalog = await this.repository.getCatalog();
    const nowIso = command.nowIso ?? new Date().toISOString();
    const pending = await this.repository.getIssuedBattle(command.playerId);
    if (pending) {
      const resumed = await this.resolvePending(command.playerId, pending, nowIso);
      if (resumed) {
        // Reanudar respeta el combate emitido: el campeón y la leyenda son los suyos, no los pedidos.
        const pair = this.describe(catalog, pending.championId, pending.opponentId);
        return {
          ...pair,
          battle: pending,
          resumed: true,
          aiProfile: pair.legend.aiProfile,
          battleTtlMinutes: catalog.settings.battleTtlMinutes,
        };
      }
    }
    const { champion, legend } = this.describe(catalog, command.championId, command.opponentId);
    const unlocked = await this.repository.getUnlockedChampionIds(command.playerId);
    if (!unlocked.includes(champion.id)) {
      throw new ValidationError("Debes derrotar a ese rival en su nivel antes de usarlo en Olimpo.");
    }
    const progress = await this.repository.getChampionProgress(command.playerId);
    const nodeRanks = progress.find((entry) => entry.championId === champion.id)?.nodeRanks ?? {};
    const nodes = catalog.nodes.filter((node) => node.championId === champion.id);
    const prepared = await this.snapshotFactory(champion, legend, nodes, nodeRanks, command.seed);
    if (prepared.snapshot.playerA.id !== command.playerId || prepared.snapshot.playerB.id !== legend.id) {
      throw new ValidationError("El snapshot no coincide con el combate resuelto.");
    }
    const expiresAtIso = new Date(
      Date.parse(nowIso) + catalog.settings.battleTtlMinutes * 60 * 1000,
    ).toISOString();
    const battle = await this.repository.issueBattle({
      playerId: command.playerId,
      battleId: command.battleId,
      championId: champion.id,
      opponentId: legend.id,
      seed: command.seed,
      protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION,
      expiresAtIso,
      ...prepared,
    });
    return {
      battle, champion, legend, resumed: false,
      aiProfile: legend.aiProfile,
      battleTtlMinutes: catalog.settings.battleTtlMinutes,
    };
  }

  /** Devuelve `true` cuando la batalla pendiente sigue siendo jugable tal cual. */
  private async resolvePending(playerId: string, pending: IOlympusBattle, nowIso: string): Promise<boolean> {
    const stored = await this.repository.getCombatSession(playerId, pending.battleId);
    const disposition = resolveIssuedBattleDisposition({
      session: stored?.session ?? null,
      snapshot: stored?.snapshot ?? null,
      nowIso,
      expectedProtocolVersion: COMBAT_PROOF_PROTOCOL_VERSION,
    });
    if (disposition === "RESUME") return true;
    if (disposition === "FORFEIT") {
      await this.repository.forfeitIssuedBattle(playerId, pending.battleId);
      throw new ValidationError("Abandonaste ese combate y se cerró como derrota; el intento ya está gastado.");
    }
    // El snapshot incompatible es deuda nuestra: se devuelve el intento antes de reemitir.
    await this.repository.invalidateIssuedBattle(playerId, pending.battleId);
    return false;
  }

  private describe(
    catalog: { champions: IOlympusChampion[]; legends: IOlympusLegend[] },
    championId: string,
    opponentId: string,
  ): { champion: IOlympusChampion; legend: IOlympusLegend } {
    const champion = catalog.champions.find((candidate) => candidate.id === championId);
    const legend = catalog.legends.find((candidate) => candidate.id === opponentId);
    if (!champion) throw new ValidationError("Ese campeón no está publicado.");
    if (!legend) throw new ValidationError("Esa leyenda no está disponible ahora mismo.");
    return { champion, legend };
  }
}
