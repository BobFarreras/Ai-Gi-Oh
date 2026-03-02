import { BattleMode } from "../entities/IPlayer";
import { createInitialGameState } from "./game-engine/create-initial-game-state";
import { changeEntityMode } from "./game-engine/change-entity-mode";
import { executeAttack } from "./game-engine/execute-attack";
import { nextPhase } from "./game-engine/next-phase";
import { playCard } from "./game-engine/play-card";
import { playCardWithEntityReplacement } from "./game-engine/play-card-with-entity-replacement";
import { resolvePendingTurnAction } from "./game-engine/resolve-pending-turn-action";
import { resolveExecution } from "./game-engine/resolve-execution";
import { GameState } from "./game-engine/types";

export type { GameState };

export class GameEngine {
  public static createInitialGameState = createInitialGameState;

  public static playCard(state: GameState, playerId: string, cardId: string, mode: BattleMode): GameState {
    return playCard(state, playerId, cardId, mode);
  }

  public static playCardWithEntityReplacement(
    state: GameState,
    playerId: string,
    cardId: string,
    mode: BattleMode,
    sacrificedEntityInstanceId: string,
  ): GameState {
    return playCardWithEntityReplacement(state, playerId, cardId, mode, sacrificedEntityInstanceId);
  }

  public static executeAttack(
    state: GameState,
    attackerPlayerId: string,
    attackerInstanceId: string,
    defenderInstanceId?: string,
  ): GameState {
    return executeAttack(state, attackerPlayerId, attackerInstanceId, defenderInstanceId);
  }

  public static nextPhase(state: GameState): GameState {
    return nextPhase(state);
  }

  public static resolveExecution(state: GameState, playerId: string, executionInstanceId: string): GameState {
    return resolveExecution(state, playerId, executionInstanceId);
  }

  public static resolvePendingTurnAction(state: GameState, playerId: string, selectedId: string): GameState {
    return resolvePendingTurnAction(state, playerId, selectedId);
  }

  public static changeEntityMode(state: GameState, playerId: string, instanceId: string, newMode: BattleMode): GameState {
    return changeEntityMode(state, playerId, instanceId, newMode);
  }
}
