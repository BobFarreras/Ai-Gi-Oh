// src/core/services/olympus/resolve-respec-quote.ts - Calcula reembolso y coste de una reasignación con las mismas reglas que la RPC.
import {
  IOlympusChampionProgress,
  IOlympusSettings,
  IOlympusUpgradeNode,
} from "@/core/entities/olympus/IOlympus";

export interface IOlympusRespecQuote {
  invested: number;
  refund: number;
  charge: number;
  netBalanceChange: number;
  free: boolean;
}

/** Coste acumulado de subir un nodo hasta `rank`: base × (1+2+…+rank). */
export function resolveInvestedInNode(fragmentCost: number, rank: number): number {
  const safeRank = Math.max(0, Math.floor(rank));
  return Math.floor((fragmentCost * safeRank * (safeRank + 1)) / 2);
}

/** Coste del SIGUIENTE rango: el precio sube con cada punto invertido en ese nodo. */
export function resolveNextRankCost(fragmentCost: number, currentRank: number): number {
  return fragmentCost * (Math.max(0, Math.floor(currentRank)) + 1);
}

/**
 * Espejo consultable del cálculo server-side: la UI puede anunciar el coste antes de confirmar, pero
 * quien cobra sigue siendo `respec_champion_upgrades`. Nunca se acepta un importe enviado por cliente.
 */
export function resolveRespecQuote(
  settings: IOlympusSettings,
  nodes: IOlympusUpgradeNode[],
  progress: IOlympusChampionProgress,
): IOlympusRespecQuote {
  const invested = nodes.reduce(
    (total, node) => total + resolveInvestedInNode(node.fragmentCost, progress.nodeRanks[node.id] ?? 0),
    0,
  );
  const refund = Math.floor((invested * settings.respecRefundPercent) / 100);
  const free = progress.respecCount < settings.respecFreeAllowance;
  const charge = free ? 0 : settings.respecCost;
  return { invested, refund, charge, netBalanceChange: refund - charge, free };
}
