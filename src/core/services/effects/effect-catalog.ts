// src/core/services/effects/effect-catalog.ts - Catálogo unificado de efectos del juego (pasivas, ejecuciones, trampas, innatos, triggers) y utilidades de consulta.
import { MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";
import { resolveMasteryPassiveLabel } from "@/core/services/progression/mastery-passive-display";
import { IEffectCatalogItem } from "@/core/services/effects/effect-catalog-types";
import {
  ENTITY_EFFECTS,
  EXECUTION_EFFECTS,
  TRAP_EFFECTS,
  TRAP_TRIGGERS,
} from "@/core/services/effects/internal/effect-catalog-data";

/** Deriva las entradas de pasiva mastery desde los labels ya existentes (evita duplicar textos). */
function buildPassiveItems(): IEffectCatalogItem[] {
  return Object.values(MASTERY_PASSIVE_IDS).map((id) => {
    const label = resolveMasteryPassiveLabel(id) ?? id;
    const [head, ...rest] = label.split(":");
    const description = rest.join(":").trim();
    return { category: "PASSIVE", key: id, name: head.trim(), description: description || label };
  });
}

/** Catálogo completo de efectos del juego, agrupable por categoría en la UI. */
export const EFFECT_CATALOG: IEffectCatalogItem[] = [
  ...buildPassiveItems(),
  ...EXECUTION_EFFECTS,
  ...TRAP_EFFECTS,
  ...ENTITY_EFFECTS,
  ...TRAP_TRIGGERS,
];

/** Busca un efecto por su identificador técnico (action, id de pasiva o trigger). */
export function findEffectByKey(key: string): IEffectCatalogItem | null {
  return EFFECT_CATALOG.find((item) => item.key === key) ?? null;
}

/** Efectos que viven en `effect` (tienen JSON de ejemplo): opciones para el editor de carta. */
export function getEffectActionOptions(): IEffectCatalogItem[] {
  return EFFECT_CATALOG.filter((item) => typeof item.exampleJson === "string");
}

/** Interpreta el JSON de un efecto y devuelve su entrada de catálogo, o null si es inválido/desconocido. */
export function describeEffectJson(effectJson: string): IEffectCatalogItem | null {
  if (!effectJson.trim()) return null;
  try {
    const parsed = JSON.parse(effectJson) as { action?: unknown };
    if (typeof parsed.action !== "string") return null;
    return findEffectByKey(parsed.action);
  } catch {
    return null;
  }
}
