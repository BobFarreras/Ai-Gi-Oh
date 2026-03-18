// src/app/hub/tutorial/arsenal/internal/resolve-tutorial-mobile-section.ts - Decide qué sección móvil (deck/almacén) debe abrirse según el paso tutorial activo.
import { ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";

type MobileSection = "DECK" | "COLLECTION";

const COLLECTION_STEP_IDS = new Set([
  "arsenal-select-collection-card",
  "arsenal-reselect-collection-card",
  "arsenal-add-deck",
  "arsenal-evolution-theory",
  "arsenal-open-evolve",
]);

/**
 * Alinea el flujo guiado con la UX móvil forzando la pestaña correcta por paso.
 */
export function resolveTutorialMobileSection(step: ITutorialFlowStep | null): MobileSection | null {
  if (!step) return null;
  if (COLLECTION_STEP_IDS.has(step.id)) return "COLLECTION";
  return "DECK";
}
