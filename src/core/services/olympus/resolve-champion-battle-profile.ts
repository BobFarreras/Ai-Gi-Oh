// src/core/services/olympus/resolve-champion-battle-profile.ts - Convierte escala base y nodos comprados en la escala real del deck prestado.
import {
  IOlympusChampion,
  IOlympusUpgradeNode,
} from "@/core/entities/olympus/IOlympus";
import { getMaxCardLevel, getTotalXpRequiredToReachLevel } from "@/core/services/progression/card-level-rules";
import { MAX_CARD_VERSION_TIER } from "@/core/services/progression/card-version-rules";

// Los topes son los del juego, no propios de Olimpo: duplicarlos los deja congelados cuando cambian.
const MAX_CARD_LEVEL = getMaxCardLevel();
const MAX_VERSION_TIER = MAX_CARD_VERSION_TIER;
const MAX_ENERGY_BONUS = 5;

export interface IOlympusChampionBattleProfile {
  level: number;
  versionTier: number;
  xp: number;
  signatureCardIds: string[];
  signatureLevel: number;
  startingLp: number;
  energyBonus: number;
}

interface ICappedTotal {
  total: number;
  cap: number;
}

/** Suma incrementos y conserva el techo más restrictivo declarado por los nodos implicados. */
function addCapped(current: ICappedTotal, amount: number, cap: number): ICappedTotal {
  return { total: current.total + Math.max(0, amount), cap: Math.min(current.cap, cap) };
}

const settle = (value: ICappedTotal): number => Math.min(value.total, value.cap);

/**
 * Solo los nodos realmente comprados alteran el deck. Los desconocidos no se ignoran en silencio:
 * el mapper del repositorio rechaza efectos que este resolutor no sabe aplicar.
 */
export function resolveChampionBattleProfile(
  champion: IOlympusChampion,
  nodes: IOlympusUpgradeNode[],
  nodeRanks: Record<string, number>,
): IOlympusChampionBattleProfile {
  /** Cada rango vuelve a aplicar el efecto: es lo que convierte el árbol en progresión y no en 4 compras. */
  const rankOf = (nodeId: string, maxRank: number): number =>
    Math.max(0, Math.min(Math.floor(nodeRanks[nodeId] ?? 0), maxRank));
  let level: ICappedTotal = { total: champion.baseScale.level, cap: MAX_CARD_LEVEL };
  let versionTier: ICappedTotal = { total: champion.baseScale.versionTier, cap: MAX_VERSION_TIER };
  let startingLp: ICappedTotal = { total: champion.baseScale.startingLp, cap: Number.MAX_SAFE_INTEGER };
  let energyBonus: ICappedTotal = { total: 0, cap: MAX_ENERGY_BONUS };
  let signature: ICappedTotal = { total: champion.baseScale.level, cap: MAX_CARD_LEVEL };
  const signatureCardIds = new Set<string>();

  for (const node of nodes) {
    if (node.championId !== champion.id) continue;
    const rank = rankOf(node.id, node.maxRank);
    if (rank === 0) continue;
    const effect = node.effect;
    const gain = effect.amount * rank;
    switch (effect.kind) {
      case "GLOBAL_LEVEL":
        level = addCapped(level, gain, effect.cap);
        signature = addCapped(signature, gain, effect.cap);
        break;
      case "GLOBAL_VERSION_TIER":
        versionTier = addCapped(versionTier, gain, effect.cap);
        break;
      case "SIGNATURE_CARD_LEVEL":
        signature = addCapped(signature, gain, effect.cap);
        for (const cardId of effect.cardIds ?? []) signatureCardIds.add(cardId);
        break;
      case "STARTING_LP":
        startingLp = addCapped(startingLp, gain, effect.cap);
        break;
      case "STARTING_ENERGY":
        energyBonus = addCapped(energyBonus, gain, effect.cap);
        break;
    }
  }

  const resolvedLevel = settle(level);
  return {
    level: resolvedLevel,
    versionTier: settle(versionTier),
    // XP real acumulada de ese nivel: la barra de la carta prestada cuadra con la del jugador.
    xp: getTotalXpRequiredToReachLevel(resolvedLevel),
    // Sin selector explícito, "emblemático" es el fusion deck: se resuelve al hidratar el mazo.
    signatureCardIds: [...signatureCardIds],
    signatureLevel: settle(signature),
    startingLp: settle(startingLp),
    energyBonus: settle(energyBonus),
  };
}
