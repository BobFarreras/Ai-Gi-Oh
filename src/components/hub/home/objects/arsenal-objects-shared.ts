// src/components/hub/home/objects/arsenal-objects-shared.ts - Tipos y lógica compartidos por los DOS flujos de
// equipar objetos del arsenal:
//   Flujo A: detalle de carta → "Equipar objeto" → sección Objetos → elegir objeto → aplicar.
//   Flujo B: sección Objetos → elegir objeto → "Equipar" → sección Cartas → elegir carta → "Activar" → aplicar.
// La aplicación real (llamada al servidor + cinemática) vive en el Scene para que ambos flujos la compartan.
import { Package, Shield, Swords } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IShopCandyItem, IShopUpgradeItem } from "@/services/market/shop-items";
import { getMaxCardLevel } from "@/core/services/progression/card-level-rules";
import { ICardUpgradeBonuses, canApplyCardUpgrade } from "@/core/services/progression/card-upgrade-rules";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";
import { IArsenalObjectApplyResult } from "@/components/hub/home/objects/ArsenalObjectApplyOverlay";

export interface ISelectableObject {
  id: string;
  name: string;
  detail: string;
  /** Icono lucide del tipo (para cuando no hay imagen). */
  icon: typeof Package;
  imageUrl: string | null;
  owned: number;
  kind: "CANDY" | "UPGRADE";
  candy?: IShopCandyItem;
  upgrade?: IShopUpgradeItem;
}

export function candyToObject(item: IShopCandyItem): ISelectableObject {
  return { id: item.id, name: item.name, detail: `+${item.levels} niv.`, icon: Package, imageUrl: item.imageUrl, owned: item.owned, kind: "CANDY", candy: item };
}

export function upgradeToObject(item: IShopUpgradeItem): ISelectableObject {
  const isAttack = item.stat === "ATTACK";
  return { id: item.id, name: item.name, detail: `+${item.value} ${isAttack ? "ATK" : "DEF"}`, icon: isAttack ? Swords : Shield, imageUrl: item.imageUrl, owned: item.owned, kind: "UPGRADE", upgrade: item };
}

const EMPTY_UPGRADES: ICardUpgradeBonuses = { attackBonus: 0, defenseBonus: 0 };

/** ¿Se puede aplicar este objeto a esta carta? (nivel máximo / tope de mejora del stat). */
export function canApplyObjectToCard(object: ISelectableObject, card: ICard, progress: IPlayerCardProgress | null, upgrades: ICardUpgradeBonuses | undefined): boolean {
  const current = upgrades ?? EMPTY_UPGRADES;
  if (object.kind === "CANDY") return (progress?.level ?? 0) < getMaxCardLevel();
  return canApplyCardUpgrade(card.cost, object.upgrade!.stat, current, object.upgrade!.value);
}

export interface IApplyObjectOutcome {
  overlay: IArsenalObjectApplyResult;
  /** Presente solo para caramelos: nuevo nivel/xp para refrescar la progresión del arsenal. */
  leveled?: { cardId: string; level: number; xp: number };
}

/**
 * Aplica un objeto a una carta llamando al servidor y construye el resultado para la cinemática. Pura salvo el
 * fetch: no toca estado de React. Lanza si el servidor rechaza (tope, saldo, etc.).
 */
export async function applyObjectToCard(
  object: ISelectableObject,
  card: ICard,
  progress: IPlayerCardProgress | null,
  upgrades: ICardUpgradeBonuses | undefined,
): Promise<IApplyObjectOutcome> {
  const current = upgrades ?? EMPTY_UPGRADES;
  if (object.kind === "CANDY") {
    const response = await fetch("/api/progression/candy/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candyId: object.id, cardId: card.id, operationId: crypto.randomUUID() }),
    });
    const body = (await response.json()) as { oldLevel: number; newLevel: number; newXp: number; error?: string };
    if (!response.ok) throw new Error(body.error ?? "No se pudo usar el objeto.");
    const syntheticProgress: IPlayerCardProgress = {
      ...(progress ?? { playerId: "", cardId: card.id, versionTier: 0, level: 0, xp: 0, masteryPassiveSkillId: null, updatedAtIso: "" }),
      level: body.newLevel,
      xp: body.newXp,
    };
    return {
      overlay: {
        card: applyCardProgressionToCard(card, syntheticProgress, current),
        versionTier: progress?.versionTier ?? 0,
        headline: `Nivel ${body.oldLevel} → ${body.newLevel}`,
        level: body.newLevel,
        xp: body.newXp,
      },
      leveled: { cardId: card.id, level: body.newLevel, xp: body.newXp },
    };
  }

  const response = await fetch("/api/progression/upgrade/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId: object.id, cardId: card.id, operationId: crypto.randomUUID() }),
  });
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? "No se pudo aplicar la mejora.");
  const stat = object.upgrade!.stat;
  const nextUpgrades: ICardUpgradeBonuses = {
    attackBonus: current.attackBonus + (stat === "ATTACK" ? object.upgrade!.value : 0),
    defenseBonus: current.defenseBonus + (stat === "DEFENSE" ? object.upgrade!.value : 0),
    attackCount: (current.attackCount ?? 0) + (stat === "ATTACK" ? 1 : 0),
    defenseCount: (current.defenseCount ?? 0) + (stat === "DEFENSE" ? 1 : 0),
  };
  return {
    overlay: {
      card: applyCardProgressionToCard(card, progress, nextUpgrades),
      versionTier: progress?.versionTier ?? 0,
      headline: `+${object.upgrade!.value} ${stat === "ATTACK" ? "ATAQUE" : "DEFENSA"}`,
      level: progress?.level ?? 0,
      xp: progress?.xp ?? 0,
    },
  };
}
