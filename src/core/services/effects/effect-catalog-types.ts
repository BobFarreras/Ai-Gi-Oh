// src/core/services/effects/effect-catalog-types.ts - Tipos del catálogo de efectos del juego (referencia admin y editor).

export type EffectCategory = "PASSIVE" | "EXECUTION" | "TRAP" | "ENTITY" | "TRAP_TRIGGER";

/** Entrada de referencia de un efecto/poder del juego con su descripción legible. */
export interface IEffectCatalogItem {
  category: EffectCategory;
  /** Identificador técnico: `effect.action`, id de pasiva o valor de `trigger`. */
  key: string;
  name: string;
  description: string;
  /** JSON de ejemplo listo para el editor; solo presente en efectos que viven en `effect`. */
  exampleJson?: string;
}
