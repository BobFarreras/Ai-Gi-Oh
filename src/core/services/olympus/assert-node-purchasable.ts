// src/core/services/olympus/assert-node-purchasable.ts - Rechaza compras imposibles antes de tocar la cartera.
import { IOlympusChampionProgress, IOlympusUpgradeNode } from "@/core/entities/olympus/IOlympus";
import { ValidationError } from "@/core/errors/ValidationError";
import { resolveNextRankCost } from "./resolve-respec-quote";

/**
 * Defensa en profundidad y mensajes legibles: la autoridad real sigue siendo
 * `purchase_champion_upgrade`, que bloquea cartera y progreso en la misma transacción.
 */
export function assertNodePurchasable(
  node: IOlympusUpgradeNode | undefined,
  progress: IOlympusChampionProgress | null,
  balance: number,
): void {
  if (!node) throw new ValidationError("El nodo de mejora no existe para este campeón.");
  if (!progress) throw new ValidationError("Necesitas desbloquear al campeón antes de mejorarlo.");
  const currentRank = progress.nodeRanks[node.id] ?? 0;
  if (currentRank >= node.maxRank) throw new ValidationError("Ese nodo ya está al rango máximo.");
  // Los prerrequisitos solo cierran el primer rango: subir lo ya abierto no vuelve a exigirlos.
  if (currentRank === 0) {
    const unlocked = new Set(progress.unlockedNodeIds);
    const missing = node.prerequisiteNodeIds.filter((id) => !unlocked.has(id));
    if (missing.length > 0) throw new ValidationError("Faltan nodos previos en esa rama del árbol.");
  }
  if (balance < resolveNextRankCost(node.fragmentCost, currentRank)) {
    throw new ValidationError("No tienes Éter suficiente.");
  }
}
