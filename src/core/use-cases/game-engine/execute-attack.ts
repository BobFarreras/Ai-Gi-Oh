import { CombatContext, CombatService } from "../CombatService";
import { IBoardEntity, IPlayer } from "../../entities/IPlayer";
import { GameRuleError } from "../../errors/GameRuleError";
import { NotFoundError } from "../../errors/NotFoundError";
import { assignPlayers, getPlayerPair } from "./player-utils";
import { GameState } from "./types";

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

  const { player: attacker, opponent: defender, isPlayerA } = getPlayerPair(state, attackerPlayerId);

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

  if (!defenderInstanceId) {
    if (defender.activeEntities.length > 0) {
      throw new GameRuleError("No puedes atacar directamente si el oponente tiene entidades en el campo.");
    }

    const damage = attackerEntity.card.attack ?? 0;
    const updatedAttacker: IPlayer = {
      ...attacker,
      activeEntities: markAttackerAsUsed(attacker.activeEntities, attackerInstanceId),
    };
    const updatedDefender: IPlayer = {
      ...defender,
      healthPoints: Math.max(0, defender.healthPoints - damage),
    };

    return assignPlayers(state, updatedAttacker, updatedDefender, isPlayerA);
  }

  const defenderEntity = defender.activeEntities.find((entity) => entity.instanceId === defenderInstanceId);

  if (!defenderEntity) {
    throw new NotFoundError("La carta defensora no está en el campo");
  }

  const isDefenderInDefenseMode = defenderEntity.mode === "DEFENSE" || defenderEntity.mode === "SET";
  const defenderStat = isDefenderInDefenseMode
    ? (defenderEntity.card.defense ?? 0)
    : (defenderEntity.card.attack ?? 0);

  const context: CombatContext = {
    attackerAtk: attackerEntity.card.attack ?? 0,
    defenderStat,
    isDefenderInDefenseMode,
  };
  const result = CombatService.calculateBattle(context);

  let updatedAttackerEntities = markAttackerAsUsed(attacker.activeEntities, attackerInstanceId);
  let updatedAttackerGraveyard = attacker.graveyard;

  if (result.attackerDestroyed) {
    updatedAttackerEntities = updatedAttackerEntities.filter((entity) => entity.instanceId !== attackerInstanceId);
    updatedAttackerGraveyard = [...updatedAttackerGraveyard, attackerEntity.card];
  }

  let updatedDefenderEntities = defender.activeEntities;
  let updatedDefenderGraveyard = defender.graveyard;

  if (result.defenderDestroyed) {
    updatedDefenderEntities = updatedDefenderEntities.filter((entity) => entity.instanceId !== defenderInstanceId);
    updatedDefenderGraveyard = [...updatedDefenderGraveyard, defenderEntity.card];
  } else if (defenderEntity.mode === "SET") {
    updatedDefenderEntities = updatedDefenderEntities.map((entity) =>
      entity.instanceId === defenderInstanceId ? { ...entity, mode: "DEFENSE" } : entity,
    );
  }

  const updatedAttacker: IPlayer = {
    ...attacker,
    healthPoints: Math.max(0, attacker.healthPoints - result.damageToAttackerPlayer),
    activeEntities: updatedAttackerEntities,
    graveyard: updatedAttackerGraveyard,
  };

  const updatedDefender: IPlayer = {
    ...defender,
    healthPoints: Math.max(0, defender.healthPoints - result.damageToDefenderPlayer),
    activeEntities: updatedDefenderEntities,
    graveyard: updatedDefenderGraveyard,
  };

  return assignPlayers(state, updatedAttacker, updatedDefender, isPlayerA);
}
