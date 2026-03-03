import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { CombatContext, CombatService } from "@/core/use-cases/CombatService";
import { resolveTrapTrigger } from "@/core/use-cases/game-engine/effects/resolve-trap-trigger";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function markAttackerAsUsed(entities: IBoardEntity[], attackerInstanceId: string): IBoardEntity[] {
  return entities.map((entity) =>
    entity.instanceId === attackerInstanceId ? { ...entity, hasAttackedThisTurn: true } : entity,
  );
}

export function executeAttack(
  state: GameState,
  attackerPlayerId: string,
  attackerInstanceId: string,
  defenderInstanceId?: string,
): GameState {
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

  const { player: attacker, opponent: defender } = getPlayerPair(state, attackerPlayerId);

  const attackerEntity = attacker.activeEntities.find((entity) => entity.instanceId === attackerInstanceId);

  if (!attackerEntity) {
    throw new NotFoundError("La carta atacante no está en el campo");
  }

  if (attackerEntity.mode !== "ATTACK") {
    throw new GameRuleError("Solo las cartas en modo ATAQUE pueden atacar");
  }

  if (attackerEntity.hasAttackedThisTurn) {
    throw new GameRuleError("Esta carta ya ha atacado este turno");
  }

  const stateAfterTrap = resolveTrapTrigger(state, defender.id, "ON_OPPONENT_ATTACK_DECLARED", {
    attackerPlayerId,
    attackerInstanceId,
  });
  const { player: currentAttacker, opponent: currentDefender, isPlayerA } = getPlayerPair(stateAfterTrap, attackerPlayerId);
  const currentAttackerEntity = currentAttacker.activeEntities.find((entity) => entity.instanceId === attackerInstanceId);

  if (!currentAttackerEntity) {
    return stateAfterTrap;
  }

  if (!defenderInstanceId) {
    if (currentDefender.activeEntities.length > 0) {
      throw new GameRuleError("No puedes atacar directamente si el oponente tiene entidades en el campo.");
    }

    const damage = currentAttackerEntity.card.attack ?? 0;
    const updatedAttacker: IPlayer = {
      ...currentAttacker,
      activeEntities: markAttackerAsUsed(currentAttacker.activeEntities, attackerInstanceId),
    };
    const updatedDefender: IPlayer = {
      ...currentDefender,
      healthPoints: Math.max(0, currentDefender.healthPoints - damage),
    };

    const withPlayers = assignPlayers(stateAfterTrap, updatedAttacker, updatedDefender, isPlayerA);
    const withAttack = appendCombatLogEvent(withPlayers, attackerPlayerId, "ATTACK_DECLARED", {
      attackerInstanceId,
      attackerCardId: currentAttackerEntity.card.id,
      target: "DIRECT",
    });
    const withDamage = appendCombatLogEvent(withAttack, attackerPlayerId, "DIRECT_DAMAGE", {
      targetPlayerId: currentDefender.id,
      amount: damage,
    });
    return appendCombatLogEvent(withDamage, attackerPlayerId, "BATTLE_RESOLVED", {
      attackerCardId: currentAttackerEntity.card.id,
      defenderCardId: null,
      attackerDestroyed: false,
      defenderDestroyed: false,
      damageToDefenderPlayer: damage,
      damageToAttackerPlayer: 0,
    });
  }

  const defenderEntity = currentDefender.activeEntities.find((entity) => entity.instanceId === defenderInstanceId);

  if (!defenderEntity) {
    throw new NotFoundError("La carta defensora no está en el campo");
  }

  const isDefenderInDefenseMode = defenderEntity.mode === "DEFENSE" || defenderEntity.mode === "SET";
  const defenderStat = isDefenderInDefenseMode
    ? (defenderEntity.card.defense ?? 0)
    : (defenderEntity.card.attack ?? 0);

  const context: CombatContext = {
    attackerAtk: currentAttackerEntity.card.attack ?? 0,
    defenderStat,
    isDefenderInDefenseMode,
  };
  const result = CombatService.calculateBattle(context);

  let updatedAttackerEntities = markAttackerAsUsed(currentAttacker.activeEntities, attackerInstanceId);
  let updatedAttackerGraveyard = currentAttacker.graveyard;

  if (result.attackerDestroyed) {
    updatedAttackerEntities = updatedAttackerEntities.filter((entity) => entity.instanceId !== attackerInstanceId);
    updatedAttackerGraveyard = [...updatedAttackerGraveyard, currentAttackerEntity.card];
  }

  let updatedDefenderEntities = currentDefender.activeEntities;
  let updatedDefenderGraveyard = currentDefender.graveyard;

  if (result.defenderDestroyed) {
    updatedDefenderEntities = updatedDefenderEntities.filter((entity) => entity.instanceId !== defenderInstanceId);
    updatedDefenderGraveyard = [...updatedDefenderGraveyard, defenderEntity.card];
  } else if (defenderEntity.mode === "SET") {
    updatedDefenderEntities = updatedDefenderEntities.map((entity) =>
      entity.instanceId === defenderInstanceId ? { ...entity, mode: "DEFENSE" } : entity,
    );
  }

  const updatedAttacker: IPlayer = {
    ...currentAttacker,
    healthPoints: Math.max(0, currentAttacker.healthPoints - result.damageToAttackerPlayer),
    activeEntities: updatedAttackerEntities,
    graveyard: updatedAttackerGraveyard,
  };

  const updatedDefender: IPlayer = {
    ...currentDefender,
    healthPoints: Math.max(0, currentDefender.healthPoints - result.damageToDefenderPlayer),
    activeEntities: updatedDefenderEntities,
    graveyard: updatedDefenderGraveyard,
  };

  const withPlayers = assignPlayers(stateAfterTrap, updatedAttacker, updatedDefender, isPlayerA);
  let withLogs = appendCombatLogEvent(withPlayers, attackerPlayerId, "ATTACK_DECLARED", {
    attackerInstanceId,
    attackerCardId: currentAttackerEntity.card.id,
    defenderInstanceId,
    defenderCardId: defenderEntity.card.id,
  });
  withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, "BATTLE_RESOLVED", {
    attackerCardId: currentAttackerEntity.card.id,
    defenderCardId: defenderEntity.card.id,
    attackerDestroyed: result.attackerDestroyed,
    defenderDestroyed: result.defenderDestroyed,
    damageToDefenderPlayer: result.damageToDefenderPlayer,
    damageToAttackerPlayer: result.damageToAttackerPlayer,
  });
  if (result.damageToDefenderPlayer > 0) {
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, "DIRECT_DAMAGE", {
      targetPlayerId: currentDefender.id,
      amount: result.damageToDefenderPlayer,
    });
  }
  if (result.damageToAttackerPlayer > 0) {
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, "DIRECT_DAMAGE", {
      targetPlayerId: currentAttacker.id,
      amount: result.damageToAttackerPlayer,
    });
  }
  if (result.attackerDestroyed) {
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, "CARD_TO_GRAVEYARD", {
      cardId: currentAttackerEntity.card.id,
      ownerPlayerId: currentAttacker.id,
      from: "BATTLEFIELD",
    });
  }
  if (result.defenderDestroyed) {
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, "CARD_TO_GRAVEYARD", {
      cardId: defenderEntity.card.id,
      ownerPlayerId: currentDefender.id,
      from: "BATTLEFIELD",
    });
  }

  return withLogs;
}
