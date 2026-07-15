// src/services/game/apply-card-progression-to-card.ts - Aplica bonus de nivel a una carta para su uso en combate sin mutar el catálogo base.
import { ICard, CardType } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { hasMaxLevelArt, resolveCardLevelBonuses } from "@/core/services/progression/card-level-bonus-rules";
import { EMPTY_CARD_UPGRADE_BONUSES, ICardUpgradeBonuses } from "@/core/services/progression/card-upgrade-rules";
import { resolveMasteryPassiveLabel } from "@/core/services/progression/mastery-passive-display";

function resolveCombatCost(cost: number, cardType: CardType, level: number): number {
  const bonuses = resolveCardLevelBonuses(cardType, level);
  return Math.max(1, cost - bonuses.energyCostReduction);
}

/**
 * Resuelve la carta lista para combate/exhibición: aplica los bonus de NIVEL y los de OBJETOS de mejora
 * permanente (ATK/DEF). El motor recibe la carta ya resuelta; da igual de dónde salen los números, así que este
 * es el único punto que hay que tocar (lo usan tablero, arsenal, mercado y los dos clientes de multijugador).
 */
export function applyCardProgressionToCard(
  card: ICard,
  progress: IPlayerCardProgress | null,
  upgrades: ICardUpgradeBonuses = EMPTY_CARD_UPGRADE_BONUSES,
): ICard {
  const level = progress?.level ?? 0;
  const bonuses = resolveCardLevelBonuses(card.type, level);
  const versionTier = progress?.versionTier ?? 0;
  // Si la progresión no fija pasiva (pre-V5 o no asignada), conserva la pasiva innata de la carta base.
  const masteryPassiveSkillId = progress?.masteryPassiveSkillId ?? card.masteryPassiveSkillId ?? null;
  // Arte de nivel máximo: solo si la carta lo tiene en el catálogo. Si aún no hay imagen, se queda con la
  // suya de siempre — el sistema está configurado y las imágenes se pueden ir subiendo después, sin tocar código.
  const renderUrl = hasMaxLevelArt(level) && card.maxLevelRenderUrl ? card.maxLevelRenderUrl : card.renderUrl;

  return {
    ...card,
    renderUrl,
    cost: resolveCombatCost(card.cost, card.type, level),
    attack: typeof card.attack === "number" ? card.attack + bonuses.attackBonus + upgrades.attackBonus : card.attack,
    defense: typeof card.defense === "number" ? card.defense + bonuses.defenseBonus + upgrades.defenseBonus : card.defense,
    versionTier,
    level,
    xp: progress?.xp ?? 0,
    masteryPassiveSkillId,
    // La etiqueta se muestra siempre que haya pasiva (innata desde V0 o de maestría a V5), con la magnitud de su versión.
    masteryPassiveLabel: masteryPassiveSkillId ? resolveMasteryPassiveLabel(masteryPassiveSkillId, versionTier) : null,
  };
}

