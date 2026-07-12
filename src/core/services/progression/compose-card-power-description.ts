// src/core/services/progression/compose-card-power-description.ts - Antepone el texto del poder (pasiva V5/innata, escalado por versión) a la descripción de la carta.
import { ICard } from "@/core/entities/ICard";
import { resolveMasteryPassiveLabel } from "./mastery-passive-display";

/**
 * Devuelve la descripción de la carta con su poder integrado al inicio (como las magias/trampas).
 * Fuente única de la línea de poder: prioriza la etiqueta ya resuelta (`masteryPassiveLabel`, con la
 * magnitud de la versión que fija la progresión) y, si falta, la deriva del `masteryPassiveSkillId`.
 * Sin pasiva describible no antepone nada (no afirma un poder vacío).
 */
export function composeCardPowerDescription(
  card: Pick<ICard, "description" | "masteryPassiveSkillId" | "masteryPassiveLabel" | "versionTier">,
): string {
  const power = card.masteryPassiveLabel ?? resolveMasteryPassiveLabel(card.masteryPassiveSkillId ?? null, card.versionTier ?? 0);
  return power ? `${power}\n\n${card.description}` : card.description;
}
