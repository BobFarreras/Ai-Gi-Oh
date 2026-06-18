// src/core/services/multiplayer/apply-match-action.ts - Aplica una acción de partida al estado del juego usando GameEngine. Reutilizable en cliente y servidor.
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";

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
      return GameEngine.executeAttack(state, playerId, action.payload.attackerInstanceId, action.payload.defenderInstanceId);
    case "NEXT_PHASE":
      return GameEngine.nextPhase(state);
    case "RESOLVE_EXECUTION":
      return GameEngine.resolveExecution(state, playerId, action.payload.instanceId);
    case "CHANGE_ENTITY_MODE":
      return GameEngine.changeEntityMode(state, playerId, action.payload.instanceId, action.payload.newMode);
    case "RESOLVE_PENDING_TURN_ACTION":
      return GameEngine.resolvePendingTurnAction(state, playerId, action.payload.selectedId);
    default:
      return state;
  }
}
