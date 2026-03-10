// src/components/game/board/hooks/internal/trapPreview.ts - Descripción breve del módulo.
import { TrapTrigger } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";

function isMatchingTrap(entity: IBoardEntity, trigger: TrapTrigger): boolean {
  return entity.card.type === "TRAP" && entity.mode === "SET" && entity.card.trigger === trigger;
}

export function findReactiveTrap(state: GameState, reactivePlayerId: string, trigger: TrapTrigger): IBoardEntity | null {
  const reactivePlayer = state.playerA.id === reactivePlayerId ? state.playerA : state.playerB;
  return reactivePlayer.activeExecutions.find((entity) => isMatchingTrap(entity, trigger)) ?? null;
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

