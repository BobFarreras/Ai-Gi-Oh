// src/core/use-cases/olympus/GetOlympusOverviewUseCase.ts - Compone el estado completo del portal de Olimpo en una sola lectura.
import {
  IOlympusAllowance,
  IOlympusBattle,
  IOlympusChampionState,
  IOlympusLegend,
  IOlympusSettings,
} from "@/core/entities/olympus/IOlympus";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { resolveOlympusAllowance, resolveOlympusPeriodKey } from "@/core/services/olympus/resolve-olympus-allowance";

export interface IOlympusOverview {
  settings: IOlympusSettings;
  allowance: IOlympusAllowance;
  legends: IOlympusLegend[];
  champions: IOlympusChampionState[];
  ascensionFragments: number;
  defeatedLegendIds: string[];
  pendingBattle: IOlympusBattle | null;
}

export class GetOlympusOverviewUseCase {
  constructor(private readonly repository: IOlympusRepository) {}

  /** Intentos, periodo y desbloqueos los deriva el servidor; el cliente solo los muestra. */
  async execute(playerId: string, nowIso = new Date().toISOString()): Promise<IOlympusOverview> {
    const catalog = await this.repository.getCatalog();
    const periodKey = resolveOlympusPeriodKey(nowIso);
    const [unlockedIds, progressList, usage, ascensionFragments, defeatedLegendIds, pendingBattle] = await Promise.all([
      this.repository.getUnlockedChampionIds(playerId),
      this.repository.getChampionProgress(playerId),
      this.repository.getDailyUsage(playerId, periodKey),
      this.repository.getFragmentBalance(playerId),
      this.repository.getDefeatedLegendIds(playerId),
      this.repository.getIssuedBattle(playerId),
    ]);
    const unlocked = new Set(unlockedIds);
    const progressByChampion = new Map(progressList.map((entry) => [entry.championId, entry]));
    return {
      settings: catalog.settings,
      allowance: resolveOlympusAllowance(catalog.settings, usage, nowIso),
      legends: catalog.legends,
      champions: catalog.champions.map((champion) => ({
        champion,
        nodes: catalog.nodes.filter((node) => node.championId === champion.id),
        progress: progressByChampion.get(champion.id) ?? null,
        unlocked: unlocked.has(champion.id),
      })),
      ascensionFragments,
      defeatedLegendIds,
      pendingBattle,
    };
  }
}
