// src/components/game/board/hooks/internal/trapPreview.ts - Localiza la trampa reactiva a previsualizar
// aplicando la MISMA condición de activación que el motor (p.ej. Escudo TypeScript solo si atacan a su entity).
import { TrapTrigger } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { trapActivationConditionMet } from "@/core/use-cases/game-engine/effects/internal/trap-selection";
import { ITrapTriggerContext } from "@/core/use-cases/game-engine/effects/internal/trap-types";
import { GameState } from "@/core/use-cases/GameEngine";

function isMatchingTrap(entity: IBoardEntity, trigger: TrapTrigger): boolean {
  return entity.card.type === "TRAP" && entity.mode === "SET" && entity.card.trigger === trigger;
}

export function findReactiveTrap(state: GameState, reactivePlayerId: string, trigger: TrapTrigger, context?: ITrapTriggerContext): IBoardEntity | null {
  const reactivePlayer = state.playerA.id === reactivePlayerId ? state.playerA : state.playerB;
  return reactivePlayer.activeExecutions.find((entity) => isMatchingTrap(entity, trigger) && trapActivationConditionMet(entity, reactivePlayer, context)) ?? null;
}

/** TODAS las trampas reactivas elegibles para el disparo (ficha 4): el motor y la UI comparten el criterio. */
export function findReactiveTraps(state: GameState, reactivePlayerId: string, trigger: TrapTrigger, context?: ITrapTriggerContext): IBoardEntity[] {
  const reactivePlayer = state.playerA.id === reactivePlayerId ? state.playerA : state.playerB;
  return reactivePlayer.activeExecutions.filter((entity) => isMatchingTrap(entity, trigger) && trapActivationConditionMet(entity, reactivePlayer, context));
}

/** Adapta entities de trampa al formato del carrusel de decisión (carta + instanceId). */
export function toTrapEligibleOptions(traps: IBoardEntity[]): { card: import("@/core/entities/ICard").ICard; instanceId: string }[] {
  return traps.map((entity) => ({ card: entity.card, instanceId: entity.instanceId }));
}

export function addRevealedId(ids: string[], entityId: string): string[] {
  if (ids.includes(entityId)) {
    return ids;
  }
  return [...ids, entityId];
}

export function removeRevealedId(ids: string[], entityId: string): string[] {
  return ids.filter((id) => id !== entityId);
}

