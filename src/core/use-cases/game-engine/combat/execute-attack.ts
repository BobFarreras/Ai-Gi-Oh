// src/core/use-cases/game-engine/combat/execute-attack.ts - Orquesta declaración de ataque, reacción de trampas y resolución de daño/combate.
import { appendDirectAttackLogs, appendEntityBattleLogs } from "@/core/use-cases/game-engine/combat/internal/attack-logging";
import { resolveDirectAttackState, resolveEntityBattleState } from "@/core/use-cases/game-engine/combat/internal/attack-resolution";
import { validateAttackDeclaration, validateAttackerEntity } from "@/core/use-cases/game-engine/combat/internal/attack-validation";
import { resolveReactiveTrapEvent } from "@/core/use-cases/game-engine/effects/internal/trap-trigger-registry";
import { markAttackerAsUsed } from "@/core/use-cases/game-engine/combat/internal/attack-entities";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { isDirectAttackBlocked } from "@/core/use-cases/game-engine/state/status-effects";
import { GameState } from "@/core/use-cases/game-engine/state/types";

interface IExecuteAttackOptions {
  skipReactivePlayerIds?: string[];
  skipTrapEventTypes?: ("ATTACK_DECLARED" | "DIRECT_ATTACK_DECLARED")[];
  /** Dueños cuyo contra-trampa (Nullify) no debe auto-activarse (el jugador decide). */
  skipCounterTrapPlayerIds?: string[];
}

/**
 * Aborta la resolución de un ataque anulado por una trampa (sin destruir al atacante): marca al atacante
 * como usado, limpia la marca transitoria y devuelve el estado. La trampa ya aplicó/logueó su efecto.
 */
function negateAttackResolution(state: GameState, attackerPlayerId: string, attackerInstanceId: string): GameState {
  const { player, opponent, isPlayerA } = getPlayerPair(state, attackerPlayerId);
  const usedAttacker = { ...player, activeEntities: markAttackerAsUsed(player.activeEntities, attackerInstanceId) };
  const cleared = assignPlayers(state, usedAttacker, opponent, isPlayerA);
  return { ...cleared, negatedAttackAttackerInstanceId: undefined };
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

  // Estado "sin ataques directos": el ataque directo (sin objetivo) queda bloqueado; los ataques a
  // entities siguen permitidos.
  if (!defenderInstanceId && isDirectAttackBlocked(state.activeStatusEffects, attackerPlayerId)) {
    throw new GameRuleError("No puedes hacer ataques directos mientras estés bajo el efecto de bloqueo.");
  }

  const stateAfterTrap = resolveReactiveTrapEvent(
    state,
    defender.id,
    { type: "ATTACK_DECLARED", context: { attackerPlayerId, attackerInstanceId, defenderInstanceId } },
    {
      skipReactivePlayerIds: options?.skipReactivePlayerIds,
      skipEventTypes: options?.skipTrapEventTypes,
      skipCounterTrapPlayerIds: options?.skipCounterTrapPlayerIds,
    },
  );
  const { player: currentAttacker, opponent: currentDefender, isPlayerA } = getPlayerPair(stateAfterTrap, attackerPlayerId);
  const currentAttackerEntity = currentAttacker.activeEntities.find((entity) => entity.instanceId === attackerInstanceId);

  if (!currentAttackerEntity) {
    return stateAfterTrap;
  }

  // Escudo Metasploit (NEGATE_ATTACK, trigger ON_OPPONENT_ATTACK_DECLARED): anula el ataque a entity o
  // directo sin destruir al atacante. La trampa ya se resolvió/logueó; aquí solo abortamos la resolución.
  if (stateAfterTrap.negatedAttackAttackerInstanceId === attackerInstanceId) {
    return negateAttackResolution(stateAfterTrap, attackerPlayerId, attackerInstanceId);
  }

  if (!defenderInstanceId) {
    const stateAfterDirectTrap = resolveReactiveTrapEvent(
      stateAfterTrap,
      currentDefender.id,
      { type: "DIRECT_ATTACK_DECLARED", context: { attackerPlayerId, attackerInstanceId } },
      {
        skipReactivePlayerIds: options?.skipReactivePlayerIds,
        skipEventTypes: options?.skipTrapEventTypes,
        skipCounterTrapPlayerIds: options?.skipCounterTrapPlayerIds,
      },
    );
    const { player: directAttacker, opponent: directDefender, isPlayerA: isPlayerADirect } = getPlayerPair(stateAfterDirectTrap, attackerPlayerId);
    const directAttackerEntity = directAttacker.activeEntities.find((entity) => entity.instanceId === attackerInstanceId);
    if (!directAttackerEntity) return stateAfterDirectTrap;
    // Flutter Enjambre: si una trampa reactiva anuló este ataque directo, el defensor no recibe daño;
    // solo marcamos al atacante como usado (el reflejo ya lo aplicó y logueó la trampa) y limpiamos la marca.
    if (stateAfterDirectTrap.negatedAttackAttackerInstanceId === attackerInstanceId) {
      return negateAttackResolution(stateAfterDirectTrap, attackerPlayerId, attackerInstanceId);
    }
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

