// src/core/services/training/resolve-training-tier-catalog.ts - Define y valida catálogo editable de tiers de entrenamiento.
import { ValidationError } from "@/core/errors/ValidationError";
import { ITrainingProgress } from "@/core/entities/training/ITrainingProgress";
import { ITrainingTierDefinition } from "@/core/entities/training/ITrainingTierDefinition";

// Cada nivel = 8 combates contra el MISMO roster fijo (ver ARENA_LADDER_ROSTER), en orden y por
// victorias; se avanza al ganar los 8 (requiredWinsInPreviousTier = 8). El tier ya NO elige rival:
// solo aporta la FUERZA del nivel (dificultad + escalado version/level/xp) y la recompensa. El
// `deckTemplateId` queda como valor informativo/compatibilidad (el roster es global).
// requiredWinsInPreviousTier = 8 en los niveles 2..8 porque el roster fijo del ladder tiene 8 rivales
// (ver ARENA_LADDER_ROSTER): completar un nivel = ganar sus 8 combates. Subir el requisito no re-bloquea
// a quien ya había desbloqueado un nivel (suelo monótono en resolveTrainingTierAccess).
// Los niveles 7 (ZENITH) y 8 (SINGULARITY) son de prestigio: MYTHIC ya está en el techo de escalado
// (versión 5 / nivel 30), así que aportan MÁS RECOMPENSA sobre ese máximo, no más stats de carta.
const DEFAULT_TRAINING_TIERS: ITrainingTierDefinition[] = [
  { tier: 1, code: "BOOT", requiredWinsInPreviousTier: 0, aiDifficulty: "EASY", deckTemplateId: "training-tier-1", rewardMultiplier: 1 },
  { tier: 2, code: "SPARK", requiredWinsInPreviousTier: 8, aiDifficulty: "NORMAL", deckTemplateId: "training-tier-2", rewardMultiplier: 1.2, defaultVersionTier: 1, defaultLevel: 10, defaultXp: 980 },
  { tier: 3, code: "CORE", requiredWinsInPreviousTier: 8, aiDifficulty: "HARD", deckTemplateId: "training-tier-3", rewardMultiplier: 1.4, defaultVersionTier: 3, defaultLevel: 10, defaultXp: 980 },
  { tier: 4, code: "ASCENT", requiredWinsInPreviousTier: 8, aiDifficulty: "BOSS", deckTemplateId: "training-tier-4", rewardMultiplier: 1.7, defaultVersionTier: 3, defaultLevel: 20, defaultXp: 2800 },
  { tier: 5, code: "NEXUS", requiredWinsInPreviousTier: 8, aiDifficulty: "MASTER", deckTemplateId: "training-tier-5", rewardMultiplier: 2.1, defaultVersionTier: 3, defaultLevel: 30, defaultXp: 5600 },
  { tier: 6, code: "APEX", requiredWinsInPreviousTier: 8, aiDifficulty: "MYTHIC", deckTemplateId: "training-tier-6", rewardMultiplier: 2.5, defaultVersionTier: 5, defaultLevel: 30, defaultXp: 9800 },
  { tier: 7, code: "ZENITH", requiredWinsInPreviousTier: 8, aiDifficulty: "MYTHIC", deckTemplateId: "training-soldado-laptop", rewardMultiplier: 2.9, defaultVersionTier: 5, defaultLevel: 30, defaultXp: 9800 },
  { tier: 8, code: "SINGULARITY", requiredWinsInPreviousTier: 8, aiDifficulty: "MYTHIC", deckTemplateId: "training-gokernel", rewardMultiplier: 3.3, defaultVersionTier: 5, defaultLevel: 30, defaultXp: 9800 },
];

interface IResolveTrainingTierCatalogInput {
  tiers?: ITrainingTierDefinition[];
}

function assertValidCatalog(catalog: ITrainingTierDefinition[]): void {
  if (catalog.length === 0) throw new ValidationError("El catálogo de entrenamiento no puede estar vacío.");
  if (catalog[0]?.tier !== 1 || catalog[0].requiredWinsInPreviousTier !== 0) {
    throw new ValidationError("El tier 1 de entrenamiento debe iniciar en 1 y sin requisito de victorias.");
  }
  for (let index = 0; index < catalog.length; index += 1) {
    const current = catalog[index];
    const expectedTier = index + 1;
    if (current.tier !== expectedTier) throw new ValidationError("Los tiers de entrenamiento deben ser consecutivos y ordenados.");
    if (current.rewardMultiplier <= 0) throw new ValidationError("El multiplicador de recompensa debe ser mayor que cero.");
    if (!current.code.trim() || !current.deckTemplateId.trim()) {
      throw new ValidationError("Cada tier de entrenamiento requiere código y deckTemplateId.");
    }
  }
}

/**
 * Devuelve un catálogo válido para permitir balanceo por configuración sin tocar reglas de dominio.
 */
export function resolveTrainingTierCatalog(input?: IResolveTrainingTierCatalogInput): ITrainingTierDefinition[] {
  const source = input?.tiers ?? DEFAULT_TRAINING_TIERS;
  const catalog = source.map((item) => ({ ...item }));
  assertValidCatalog(catalog);
  return catalog;
}

/**
 * Crea un progreso inicial neutro para jugadores nuevos en entrenamiento.
 */
export function createInitialTrainingProgress(playerId: string): ITrainingProgress {
  if (!playerId.trim()) throw new ValidationError("El identificador del jugador es obligatorio para entrenamiento.");
  return {
    playerId,
    highestUnlockedTier: 1,
    totalWins: 0,
    totalMatches: 0,
    tierStats: [],
    updatedAtIso: new Date().toISOString(),
  };
}
