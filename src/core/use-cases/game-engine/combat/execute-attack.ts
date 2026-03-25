// src/core/use-cases/game-engine/combat/execute-attack.ts - Orquesta declaración de ataque, reacción de trampas y resolución de daño/combate.
import { appendDirectAttackLogs, appendEntityBattleLogs } from "@/core/use-cases/game-engine/combat/internal/attack-logging";
import { resolveDirectAttackState, resolveEntityBattleState } from "@/core/use-cases/game-engine/combat/internal/attack-resolution";
import { validateAttackDeclaration, validateAttackerEntity } from "@/core/use-cases/game-engine/combat/internal/attack-validation";
import { resolveReactiveTrapEvent } from "@/core/use-cases/game-engine/effects/internal/trap-trigger-registry";
import { getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export function executeAttack(
  state: GameState,
  attackerPlayerId: string,
  attackerInstanceId: string,
  defenderInstanceId?: string,
): GameState {
  validateAttackDeclaration(state, attackerPlayerId);

  const { player: attacker, opponent: defender } = getPlayerPair(state, attackerPlayerId);
  validateAttackerEntity(attacker.activeEntities.find((entity) => entity.instanceId === attackerInstanceId));

  const stateAfterTrap = resolveReactiveTrapEvent(state, defender.id, { type: "ATTACK_DECLARED", context: { attackerPlayerId, attackerInstanceId } });
  const { player: currentAttacker, opponent: currentDefender, isPlayerA } = getPlayerPair(stateAfterTrap, attackerPlayerId);
  const currentAttackerEntity = currentAttacker.activeEntities.find((entity) => entity.instanceId === attackerInstanceId);

  if (!currentAttackerEntity) {
    return stateAfterTrap;
  }

  if (!defenderInstanceId) {
    const resolvedDirectAttack = resolveDirectAttackState({
      state: stateAfterTrap,
      attacker: currentAttacker,
      defender: currentDefender,
      attackerEntity: currentAttackerEntity,
      attackerInstanceId,
      isPlayerA,
    });
    return appendDirectAttackLogs(
      resolvedDirectAttack.state,
      attackerPlayerId,
      currentAttackerEntity,
      currentDefender.id,
      resolvedDirectAttack.damage,
    );
  }

  const resolvedBattle = resolveEntityBattleState({
    state: stateAfterTrap,
    attacker: currentAttacker,
    defender: currentDefender,
    attackerEntity: currentAttackerEntity,
    defenderInstanceId,
    attackerInstanceId,
    isPlayerA,
  });
  return appendEntityBattleLogs({
    state: resolvedBattle.state,
    attackerPlayerId,
    attacker: currentAttackerEntity,
    defender: resolvedBattle.defenderEntity,
    result: resolvedBattle.result,
    defenderPlayerId: currentDefender.id,
    attackerPlayerTargetId: currentAttacker.id,
  });
}

