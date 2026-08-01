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

/**
 * Espejo consultable del cálculo server-side: la UI puede anunciar el coste antes de confirmar, pero
 * quien cobra sigue siendo `respec_champion_upgrades`. Nunca se acepta un importe enviado por cliente.
 */
export function resolveRespecQuote(
  settings: IOlympusSettings,
  nodes: IOlympusUpgradeNode[],
  progress: IOlympusChampionProgress,
): IOlympusRespecQuote {
  const unlocked = new Set(progress.unlockedNodeIds);
  const invested = nodes
    .filter((node) => unlocked.has(node.id))
    .reduce((total, node) => total + node.fragmentCost, 0);
  const refund = Math.floor((invested * settings.respecRefundPercent) / 100);
  const free = progress.respecCount < settings.respecFreeAllowance;
  const charge = free ? 0 : settings.respecCost;
  return { invested, refund, charge, netBalanceChange: refund - charge, free };
}
