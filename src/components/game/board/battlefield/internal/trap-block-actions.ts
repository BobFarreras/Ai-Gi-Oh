// src/components/game/board/battlefield/internal/trap-block-actions.ts - Lista de acciones de trampa que bloquean o niegan acciones en combate.
import { IBoardEntity } from "@/core/entities/IPlayer";

export function isTrapBlockAction(action: string | undefined): boolean {
  if (!action) return false;
  return action === "NEGATE_ATTACK_AND_DESTROY_ATTACKER" || action === "NEGATE_OPPONENT_TRAP_AND_DESTROY" || action === "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED";
}

/** Detecta si existe una trampa activa de tipo bloqueo en cualquier lado del tablero. */
export function hasActiveBlockingTrap(executions: IBoardEntity[]): boolean {
  return executions.some((entity) => entity.card.type === "TRAP" && entity.mode === "ACTIVATE" && isTrapBlockAction(entity.card.effect?.action));
}
