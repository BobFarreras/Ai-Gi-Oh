// src/components/game/board/internal/hud-props-equality.ts - Comparador por contenido para memoizar el HUD de jugador/oponente sin re-render en acciones ajenas.
import type { CSSProperties } from "react";
import { IPlayer } from "@/core/entities/IPlayer";
import type { PlayerHUDProps } from "@/components/game/board/PlayerHUD";

/** Solo importan al HUD los campos que muestra: LP, energía y nombre. */
function arePlayerHudFieldsEqual(a: IPlayer, b: IPlayer): boolean {
  return (
    a === b ||
    (a.healthPoints === b.healthPoints &&
      a.maxHealthPoints === b.maxHealthPoints &&
      a.currentEnergy === b.currentEnergy &&
      a.maxEnergy === b.maxEnergy &&
      a.name === b.name)
  );
}

/** Compara estilos inline de forma shallow (top/bottom del HUD móvil cambian de referencia cada render). */
function areStylesEqual(a?: CSSProperties, b?: CSSProperties): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((key) => (a as Record<string, unknown>)[key] === (b as Record<string, unknown>)[key]);
}

/** Re-render del HUD solo si cambia algo que afecta su render (stats, feedback, turno, retrato). */
export function areEqualPlayerHudProps(previous: PlayerHUDProps, next: PlayerHUDProps): boolean {
  return (
    arePlayerHudFieldsEqual(previous.player, next.player) &&
    previous.isOpponent === next.isOpponent &&
    previous.isActiveTurn === next.isActiveTurn &&
    previous.badgeText === next.badgeText &&
    previous.wasDamagedThisAction === next.wasDamagedThisAction &&
    previous.damagePulseKey === next.damagePulseKey &&
    previous.damageAmount === next.damageAmount &&
    previous.wasHealedThisAction === next.wasHealedThisAction &&
    previous.healPulseKey === next.healPulseKey &&
    previous.healAmount === next.healAmount &&
    previous.wasEnergyGainedThisAction === next.wasEnergyGainedThisAction &&
    previous.energyPulseKey === next.energyPulseKey &&
    previous.energyAmount === next.energyAmount &&
    previous.wasEnergyLostThisAction === next.wasEnergyLostThisAction &&
    previous.energyLossPulseKey === next.energyLossPulseKey &&
    previous.energyLossAmount === next.energyLossAmount &&
    previous.avatarUrl === next.avatarUrl &&
    previous.dialogueMessage === next.dialogueMessage &&
    previous.phase === next.phase &&
    previous.onAdvancePhase === next.onAdvancePhase &&
    previous.containerClassName === next.containerClassName &&
    areStylesEqual(previous.containerStyle, next.containerStyle) &&
    previous.showPhaseControls === next.showPhaseControls &&
    previous.showEnergy === next.showEnergy
  );
}
