// src/core/use-cases/olympus/ManageChampionUpgradesUseCase.ts - Compra y reasigna nodos con operaciones idempotentes derivadas en servidor.
import { IOlympusChampionProgress } from "@/core/entities/olympus/IOlympus";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { assertNodePurchasable } from "@/core/services/olympus/assert-node-purchasable";
import { IOlympusRespecQuote, resolveRespecQuote } from "@/core/services/olympus/resolve-respec-quote";
import { ValidationError } from "@/core/errors/ValidationError";

export interface IChampionUpgradeResult {
  ascensionFragments: number;
  progress: IOlympusChampionProgress | null;
}

export class ManageChampionUpgradesUseCase {
  constructor(private readonly repository: IOlympusRepository) {}

  /**
   * El `operationId` se deriva del nodo, no del cliente: reintentar la misma compra es idempotente y
   * dos pestañas nunca pagan dos veces por el mismo nodo.
   */
  async purchase(playerId: string, championId: string, nodeId: string): Promise<IChampionUpgradeResult> {
    const catalog = await this.repository.getCatalog();
    if (!catalog.champions.some((champion) => champion.id === championId)) {
      throw new ValidationError("Ese campeón no está publicado.");
    }
    await this.assertChampionUnlocked(playerId, championId);
    const node = catalog.nodes.find((candidate) => candidate.id === nodeId && candidate.championId === championId);
    const [progress, balance] = await Promise.all([
      this.findProgress(playerId, championId),
      this.repository.getFragmentBalance(playerId),
    ]);
    assertNodePurchasable(node, progress, balance);
    const ascensionFragments = await this.repository.purchaseUpgrade(
      playerId, championId, nodeId, `olympus-upgrade:${playerId}:${championId}:${nodeId}`,
    );
    return { ascensionFragments, progress: await this.findProgress(playerId, championId) };
  }

  /** La primera reasignación por campeón es gratuita; las siguientes cobran el coste configurado. */
  async respec(
    playerId: string,
    championId: string,
  ): Promise<IChampionUpgradeResult & { quote: IOlympusRespecQuote }> {
    const catalog = await this.repository.getCatalog();
    await this.assertChampionUnlocked(playerId, championId);
    const progress = await this.findProgress(playerId, championId);
    if (!progress) throw new ValidationError("Necesitas desbloquear al campeón antes de reasignar su árbol.");
    const nodes = catalog.nodes.filter((node) => node.championId === championId);
    const quote = resolveRespecQuote(catalog.settings, nodes, progress);
    if (quote.refund <= 0) throw new ValidationError("No hay mejoras que reasignar en este campeón.");
    const balance = await this.repository.getFragmentBalance(playerId);
    if (balance + quote.refund < quote.charge) {
      throw new ValidationError("No tienes Fragmentos suficientes para pagar la reasignación.");
    }
    const ascensionFragments = await this.repository.respecUpgrades(
      playerId, championId, `olympus-respec:${playerId}:${championId}:${progress.respecCount}`,
    );
    return { ascensionFragments, progress: await this.findProgress(playerId, championId), quote };
  }

  private async assertChampionUnlocked(playerId: string, championId: string): Promise<void> {
    const unlocked = await this.repository.getUnlockedChampionIds(playerId);
    if (!unlocked.includes(championId)) {
      throw new ValidationError("Debes derrotar a ese rival en su nivel antes de usarlo en Olimpo.");
    }
  }

  private async findProgress(playerId: string, championId: string): Promise<IOlympusChampionProgress | null> {
    const progress = await this.repository.getChampionProgress(playerId);
    return progress.find((entry) => entry.championId === championId) ?? null;
  }
}
