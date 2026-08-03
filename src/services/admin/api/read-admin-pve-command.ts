// src/services/admin/api/read-admin-pve-command.ts - Parsea y valida los comandos del panel admin de Supervivencia y Olimpo.
import { ValidationError } from "@/core/errors/ValidationError";
import {
  IAdminSurvivalStage,
  IPublishOlympusSettingsCommand,
  IPublishSurvivalRulesetCommand,
  IUpsertOlympusChampionCommand,
  IUpsertOlympusLegendCommand,
  IUpsertOlympusNodeCommand,
} from "@/core/entities/admin/IAdminPveModes";
import {
  OLYMPUS_AI_PROFILES,
  OLYMPUS_UPGRADE_BRANCHES,
  OLYMPUS_UPGRADE_EFFECT_KINDS,
  SURVIVAL_AI_PROFILES,
} from "@/core/entities/admin/IAdminPveModes.types";
import { IAdminArenaCardEntry } from "@/core/entities/training/IAdminArena";
import { getMaxCardLevel, getTotalXpRequiredToReachLevel } from "@/core/services/progression/card-level-rules";
import { MAX_CARD_VERSION_TIER } from "@/core/services/progression/card-version-rules";

type Raw = Record<string, unknown>;

function asString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError(`${field} es obligatorio.`);
  return value.trim();
}
function asOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function asInteger(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new ValidationError(`${field} debe ser un entero entre ${min} y ${max}.`);
  }
  return value;
}
function asStringList(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) throw new ValidationError(`${field} debe ser una lista.`);
  return value.map((item) => asString(item, field));
}
function asOption<T extends string>(value: unknown, options: readonly T[], field: string): T {
  if (typeof value !== "string" || !options.includes(value as T)) {
    throw new ValidationError(`${field} debe ser uno de: ${options.join(", ")}.`);
  }
  return value as T;
}

/**
 * El deck legendario comparte forma con el de Arena para reutilizar su editor visual sin duplicar tipos.
 * Los topes salen de las reglas de progresión, no de constantes propias: cuando el juego subió el nivel
 * máximo a 100, tenerlos duplicados aquí es lo que hacía rechazar guardados perfectamente válidos.
 */
function readCardEntries(value: unknown, field: string): IAdminArenaCardEntry[] {
  if (!Array.isArray(value)) throw new ValidationError(`${field} debe ser una lista de cartas.`);
  const maxLevel = getMaxCardLevel();
  return value.map((raw) => {
    const entry = raw as Raw;
    return {
      cardId: asString(entry.cardId, "La carta"),
      versionTier: asInteger(entry.versionTier ?? MAX_CARD_VERSION_TIER, "La versión de la carta", 1, MAX_CARD_VERSION_TIER),
      level: asInteger(entry.level ?? maxLevel, "El nivel de la carta", 1, maxLevel),
      xp: asInteger(entry.xp ?? 0, "La experiencia de la carta", 0, getTotalXpRequiredToReachLevel(maxLevel)),
      attackBonus: asInteger(entry.attackBonus ?? 0, "El bonus de ataque", 0, 100_000),
      defenseBonus: asInteger(entry.defenseBonus ?? 0, "El bonus de defensa", 0, 100_000),
    };
  });
}

function readStage(raw: unknown): IAdminSurvivalStage {
  const stage = raw as Raw;
  return {
    fromBattle: asInteger(stage.fromBattle, "El combate inicial del tramo", 1, 10_000),
    aiProfile: asOption(stage.aiProfile, SURVIVAL_AI_PROFILES, "El perfil de IA"),
    maxTier: asInteger(stage.maxTier, "El tier máximo", 1, 20),
    maxLpBonus: asInteger(stage.maxLpBonus, "El bonus de LP", 0, 100_000),
    statBonusPerRank: asInteger(stage.statBonusPerRank, "El bonus de stats por vuelta", 0, 100_000),
    rewardDefinitionId: asString(stage.rewardDefinitionId, "La definición de recompensa"),
  };
}

export function readPublishSurvivalRulesetCommand(data: Raw): IPublishSurvivalRulesetCommand {
  const stages = Array.isArray(data.stages) ? data.stages.map(readStage) : [];
  if (stages.length === 0) throw new ValidationError("Un ruleset necesita al menos un tramo de escalado.");
  if (!stages.some((stage) => stage.fromBattle === 1)) {
    throw new ValidationError("El primer tramo debe empezar en el combate 1.");
  }
  const roster = asStringList(data.roster, "El roster");
  if (roster.length === 0) throw new ValidationError("El roster no puede quedar vacío.");
  return {
    startTier: asInteger(data.startTier, "El tier inicial", 1, 20),
    battlesPerTier: asInteger(data.battlesPerTier, "Los combates por tier", 1, 100),
    roster,
    milestoneInterval: asInteger(data.milestoneInterval, "El intervalo de hito", 1, 100),
    milestoneHeal: asInteger(data.milestoneHeal, "La curación de hito", 0, 100_000),
    stages,
  };
}

export function readPublishOlympusSettingsCommand(data: Raw): IPublishOlympusSettingsCommand {
  return {
    dailyAttemptLimit: asInteger(data.dailyAttemptLimit, "El límite diario", 1, 10),
    battleTtlMinutes: asInteger(data.battleTtlMinutes, "La caducidad de la batalla", 5, 240),
    respecFreeAllowance: asInteger(data.respecFreeAllowance, "Las reasignaciones gratuitas", 0, 10),
    respecCost: asInteger(data.respecCost, "El coste de reasignación", 0, 100_000),
    respecRefundPercent: asInteger(data.respecRefundPercent, "El porcentaje de reembolso", 0, 100),
  };
}

export function readUpsertOlympusLegendCommand(data: Raw): IUpsertOlympusLegendCommand {
  const availableFromIso = asOptionalString(data.availableFromIso);
  const availableUntilIso = asOptionalString(data.availableUntilIso);
  if (availableFromIso && availableUntilIso && Date.parse(availableUntilIso) <= Date.parse(availableFromIso)) {
    throw new ValidationError("La ventana de disponibilidad termina antes de empezar.");
  }
  return {
    id: asString(data.id, "El id de la leyenda"),
    code: asString(data.code, "El código"),
    displayName: asString(data.displayName, "El nombre visible"),
    deckTemplateId: asString(data.deckTemplateId, "La variante de mazo base"),
    aiProfile: asOption(data.aiProfile, OLYMPUS_AI_PROFILES, "El perfil de IA"),
    startingLp: asInteger(data.startingLp, "Los LP iniciales", 1000, 100_000),
    energyBonus: asInteger(data.energyBonus, "El bonus de energía", 0, 5),
    rewardDefinitionId: asString(data.rewardDefinitionId, "La definición de recompensa"),
    avatarPath: asOptionalString(data.avatarPath),
    introPath: asOptionalString(data.introPath),
    victoryPath: asOptionalString(data.victoryPath),
    defeatPath: asOptionalString(data.defeatPath),
    lore: asOptionalString(data.lore),
    specialRules: Array.isArray(data.specialRules) ? asStringList(data.specialRules, "Las reglas especiales") : [],
    baseFragmentReward: asInteger(data.baseFragmentReward, "La recompensa base", 0, 100_000),
    firstVictoryFragmentBonus: asInteger(data.firstVictoryFragmentBonus, "El bonus de primera victoria", 0, 100_000),
    defeatFragmentReward: asInteger(data.defeatFragmentReward, "La compensación por derrota", 0, 100_000),
    nexusReward: asInteger(data.nexusReward ?? 0, "El Nexus por victoria", 0, 1_000_000),
    // El id se valida de verdad contra `cards_catalog` por FK; aquí solo se normaliza el vacío.
    cardRewardId: asOptionalString(data.cardRewardId),
    cardRewardFirstVictoryOnly: data.cardRewardFirstVictoryOnly !== false,
    availableFromIso,
    availableUntilIso,
    isActive: data.isActive === true,
    sortOrder: asInteger(data.sortOrder ?? 0, "El orden", 0, 10_000),
    deckCards: readCardEntries(data.deckCards, "El deck legendario"),
    fusionCards: readCardEntries(data.fusionCards, "El deck de fusión"),
  };
}

export function readUpsertOlympusChampionCommand(data: Raw): IUpsertOlympusChampionCommand {
  return {
    id: asString(data.id, "El id del campeón"),
    arenaOpponentId: asString(data.arenaOpponentId, "El rival de Arena"),
    requiredTier: asInteger(data.requiredTier, "El tier requerido", 1, 20),
    requiredLadderPosition: asInteger(data.requiredLadderPosition, "La posición del ladder", 1, 20),
    baseDeckVariantId: asString(data.baseDeckVariantId, "La variante de mazo base"),
    baseLevel: asInteger(data.baseLevel, "El nivel base", 0, getMaxCardLevel()),
    baseVersionTier: asInteger(data.baseVersionTier, "La versión base", 0, MAX_CARD_VERSION_TIER),
    baseStartingLp: asInteger(data.baseStartingLp, "Los LP iniciales", 1000, 100_000),
    isActive: data.isActive === true,
  };
}

export function readUpsertOlympusNodeCommand(data: Raw): IUpsertOlympusNodeCommand {
  const id = asString(data.id, "El id del nodo");
  const prerequisiteNodeIds = Array.isArray(data.prerequisiteNodeIds)
    ? asStringList(data.prerequisiteNodeIds, "Los prerrequisitos")
    : [];
  if (prerequisiteNodeIds.includes(id)) {
    throw new ValidationError("Un nodo no puede ser prerrequisito de sí mismo.");
  }
  return {
    id,
    championId: asString(data.championId, "El campeón"),
    branch: asOption(data.branch, OLYMPUS_UPGRADE_BRANCHES, "La rama"),
    prerequisiteNodeIds,
    // Solo se publican efectos que el resolutor de combate sabe aplicar; el resto sería un nodo cobrado sin efecto.
    effectKind: asOption(data.effectKind, OLYMPUS_UPGRADE_EFFECT_KINDS, "El tipo de efecto"),
    effectAmount: asInteger(data.effectAmount, "La magnitud del efecto", 1, 100_000),
    effectCap: asInteger(data.effectCap, "El tope del efecto", 1, 100_000),
    effectCardIds: Array.isArray(data.effectCardIds) ? asStringList(data.effectCardIds, "Las cartas del selector") : [],
    fragmentCost: asInteger(data.fragmentCost, "El coste en Fragmentos", 1, 100_000),
    sortOrder: asInteger(data.sortOrder ?? 0, "El orden", 0, 10_000),
    isActive: data.isActive === true,
  };
}
