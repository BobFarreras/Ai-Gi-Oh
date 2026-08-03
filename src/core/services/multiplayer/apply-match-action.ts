// src/core/services/multiplayer/apply-match-action.ts - Aplica una acción de partida al estado del juego usando GameEngine. Reutilizable en cliente y servidor.
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IMatchActionPayload } from "@/core/entities/match";

/** Resuelve el defensor potencial sin asumir que el actor ocupa siempre playerB. */
function resolveOtherPlayerId(state: GameState, playerId: string): string {
  return state.playerA.id === playerId ? state.playerB.id : state.playerA.id;
}

export function applyMatchAction(state: GameState, playerId: string, action: IMatchActionPayload): GameState {
  switch (action.type) {
    case "PLAY_CARD":
      return GameEngine.playCard(state, playerId, action.payload.cardId, action.payload.mode);
    case "PLAY_CARD_REPLACE_ENTITY":
      return GameEngine.playCardWithEntityReplacement(
        state,
        playerId,
        action.payload.cardId,
        action.payload.mode,
        action.payload.sacrificedEntityInstanceId,
      );
    case "PLAY_CARD_REPLACE_ZONE":
      return GameEngine.playCardWithZoneReplacement(
        state,
        playerId,
        action.payload.cardId,
        action.payload.mode,
        action.payload.sacrificedEntityInstanceId,
        action.payload.zone,
      );
    case "FUSE_CARDS":
      return GameEngine.fuseCards(
        state,
        playerId,
        action.payload.cardId,
        [action.payload.material1InstanceId, action.payload.material2InstanceId],
        action.payload.mode,
      );
    case "START_FUSION_SUMMON":
      return GameEngine.startFusionSummon(state, playerId, action.payload.cardId, action.payload.mode);
    case "ATTACK":
      return GameEngine.executeAttack(state, playerId, action.payload.attackerInstanceId, action.payload.defenderInstanceId, {
        skipCounterTrapPlayerIds: action.payload.declineCounterTrap ? [playerId] : undefined,
        deferReactiveTraps: action.payload.deferReactiveTraps,
        skipReactivePlayerIds: action.payload.declineReactiveTrap ? [resolveOtherPlayerId(state, playerId)] : undefined,
        skipTrapEventTypes: action.payload.declineReactiveTrap ? ["ATTACK_DECLARED"] : undefined,
        chosenTrapInstanceId: action.payload.chosenTrapInstanceId,
      });
    case "RESOLVE_REACTIVE_TRAP":
      // `playerId` es QUIEN emitió la acción; el motor exige que sea el defensor de la pausa (un atacante que
      // intente forzar la elección de trampa del rival es rechazado). La trampa elegida se revalida además.
      return GameEngine.resolveReactiveTrapDecision(state, playerId, {
        activate: action.payload.activate,
        chosenTrapInstanceId: action.payload.chosenTrapInstanceId,
      });
    case "NEXT_PHASE":
      return GameEngine.nextPhase(state);
    case "RESOLVE_EXECUTION":
      return GameEngine.resolveExecution(state, playerId, action.payload.instanceId, {
        skipCounterTrapPlayerIds: action.payload.declineCounterTrap ? [playerId] : undefined,
        skipReactivePlayerIds: action.payload.declineReactiveTrap ? [resolveOtherPlayerId(state, playerId)] : undefined,
        skipTrapEventTypes: action.payload.declineReactiveTrap ? ["EXECUTION_ACTIVATED"] : undefined,
        chosenTrapInstanceId: action.payload.chosenTrapInstanceId,
      });
    case "CHANGE_ENTITY_MODE":
      return GameEngine.changeEntityMode(state, playerId, action.payload.instanceId, action.payload.newMode);
    case "RESOLVE_PENDING_TURN_ACTION":
      return GameEngine.resolvePendingTurnAction(state, playerId, action.payload.selectedId);
    default:
      return state;
  }
}
