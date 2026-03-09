// src/core/use-cases/game-engine/combat/internal/attack-validation.ts - Descripción breve del módulo.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export function validateAttackDeclaration(state: GameState, attackerPlayerId: string): void {
  if (state.pendingTurnAction) {
    throw new GameRuleError("Debes resolver la acción obligatoria de inicio de turno antes de declarar ataques.");
  }

  if (state.phase !== "BATTLE") {
    throw new GameRuleError("Solo puedes atacar durante la fase BATTLE.");
  }

  if (state.activePlayerId !== attackerPlayerId) {
    throw new GameRuleError("Solo el jugador activo puede declarar ataques.");
  }

  if (state.turn === 1 && state.startingPlayerId === attackerPlayerId) {
    throw new GameRuleError("El jugador inicial no puede atacar durante el primer turno.");
  }
}

export function validateAttackerEntity(
  attackerEntity: IBoardEntity | undefined,
): IBoardEntity {
  if (!attackerEntity) {
    throw new NotFoundError("La carta atacante no está en el campo");
  }

  if (attackerEntity.mode !== "ATTACK") {
    throw new GameRuleError("Solo las cartas en modo ATAQUE pueden atacar");
  }

  if (attackerEntity.hasAttackedThisTurn) {
    throw new GameRuleError("Esta carta ya ha atacado este turno");
  }

  return attackerEntity;
}

export function validateDirectAttack(hasDefenders: boolean): void {
  if (hasDefenders) {
    throw new GameRuleError("No puedes atacar directamente si el oponente tiene entidades en el campo.");
  }
}

