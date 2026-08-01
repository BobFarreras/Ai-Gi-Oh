// src/core/entities/admin/IAdminPveModes.types.ts - Vocabulario cerrado del árbol de Olimpo, compartido por admin y runtime.
import { IOlympusUpgradeEffect, OlympusUpgradeBranch } from "@/core/entities/olympus/IOlympus";

export type IOlympusUpgradeBranch = OlympusUpgradeBranch;

export const OLYMPUS_UPGRADE_BRANCHES: readonly OlympusUpgradeBranch[] = ["POWER", "RESILIENCE", "IDENTITY"];

/**
 * El admin solo puede publicar efectos que el resolutor de combate sabe aplicar. Publicar cualquier otro
 * dejaría un nodo cobrado sin efecto, así que la lista vive aquí y la validan API y UI.
 */
export const OLYMPUS_UPGRADE_EFFECT_KINDS: readonly IOlympusUpgradeEffect["kind"][] = [
  "GLOBAL_LEVEL",
  "GLOBAL_VERSION_TIER",
  "SIGNATURE_CARD_LEVEL",
  "STARTING_LP",
  "STARTING_ENERGY",
];

export const SURVIVAL_AI_PROFILES = ["HARD", "BOSS", "MASTER", "MYTHIC"] as const;
export const OLYMPUS_AI_PROFILES = ["MASTER", "MYTHIC"] as const;
