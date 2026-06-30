// src/core/services/progression/compose-card-power-description.ts - Antepone el texto del poder (pasiva V5/innata, escalado por versión) a la descripción de la carta.
import { ICard } from "@/core/entities/ICard";
import { resolveMasteryPassiveLabel } from "./mastery-passive-display";

/**
 * Devuelve la descripción de la carta con su poder integrado al inicio (como las magias/trampas).
 * La magnitud se resuelve a la versión de la carta (V0 base si no tiene progreso), para coincidir con la cara.
 */
export function composeCardPowerDescription(
  card: Pick<ICard, "description" | "masteryPassiveSkillId" | "versionTier">,
): string {
  const power = resolveMasteryPassiveLabel(card.masteryPassiveSkillId ?? null, card.versionTier ?? 0);
  return power ? `${power}\n\n${card.description}` : card.description;
}
