// src/core/use-cases/game-engine/combat/execute-attack.ts - Orquesta declaración de ataque, reacción de trampas y resolución de daño/combate.
import { appendDirectAttackLogs, appendEntityBattleLogs } from "@/core/use-cases/game-engine/combat/internal/attack-logging";
import { resolveDirectAttackState, resolveEntityBattleState } from "@/core/use-cases/game-engine/combat/internal/attack-resolution";
import { validateAttackDeclaration, validateAttackerEntity } from "@/core/use-cases/game-engine/combat/internal/attack-validation";
import { resolveReactiveTrapEvent } from "@/core/use-cases/game-engine/effects/internal/trap-trigger-registry";
import { getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

interface IExecuteAttackOptions {
  skipReactivePlayerIds?: string[];
  skipTrapEventTypes?: ("ATTACK_DECLARED" | "DIRECT_ATTACK_DECLARED")[];
}

export function executeAttack(
  state: GameState,
  attackerPlayerId: string,
  attackerInstanceId: string,
  defenderInstanceId?: string,
  options?: IExecuteAttackOptions,
): GameState {
  validateAttackDeclaration(state, attackerPlayerId);

  const { player: attacker, opponent: defender } = getPlayerPair(state, attackerPlayerId);
  validateAttackerEntity(attacker.activeEntities.find((entity) => entity.instanceId === attackerInstanceId));

  const stateAfterTrap = resolveReactiveTrapEvent(
    state,
    defender.id,
    { type: "ATTACK_DECLARED", context: { attackerPlayerId, attackerInstanceId } },
    {
      skipReactivePlayerIds: options?.skipReactivePlayerIds,
      skipEventTypes: options?.skipTrapEventTypes,
    },
  );
  const { player: currentAttacker, opponent: currentDefender, isPlayerA } = getPlayerPair(stateAfterTrap, attackerPlayerId);
  const currentAttackerEntity = currentAttacker.activeEntities.find((entity) => entity.instanceId === attackerInstanceId);

  if (!currentAttackerEntity) {
    return stateAfterTrap;
  }

  if (!defenderInstanceId) {
    const stateAfterDirectTrap = resolveReactiveTrapEvent(
      stateAfterTrap,
      currentDefender.id,
      { type: "DIRECT_ATTACK_DECLARED", context: { attackerPlayerId, attackerInstanceId } },
      {
        skipReactivePlayerIds: options?.skipReactivePlayerIds,
        skipEventTypes: options?.skipTrapEventTypes,
      },
    );
    const { player: directAttacker, opponent: directDefender, isPlayerA: isPlayerADirect } = getPlayerPair(stateAfterDirectTrap, attackerPlayerId);
    const directAttackerEntity = directAttacker.activeEntities.find((entity) => entity.instanceId === attackerInstanceId);
    if (!directAttackerEntity) return stateAfterDirectTrap;
    const resolvedDirectAttack = resolveDirectAttackState({
      state: stateAfterDirectTrap,
      attacker: directAttacker,
      defender: directDefender,
      attackerEntity: directAttackerEntity,
      attackerInstanceId,
      isPlayerA: isPlayerADirect,
    });
    return appendDirectAttackLogs(
      resolvedDirectAttack.state,
      attackerPlayerId,
      directAttackerEntity,
      directDefender.id,
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

