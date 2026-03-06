import { BattleMode } from "../entities/IPlayer";
import { changeEntityMode } from "./game-engine/actions/change-entity-mode";
import { playCard } from "./game-engine/actions/play-card";
import { playCardWithEntityReplacement } from "./game-engine/actions/play-card-with-entity-replacement";
import { resolveExecution } from "./game-engine/actions/resolve-execution";
import { executeAttack } from "./game-engine/combat/execute-attack";
import { fuseCards } from "./game-engine/fusion/fuse-cards";
import { startFusionSummon } from "./game-engine/fusion/start-fusion-summon";
import { nextPhase } from "./game-engine/phases/next-phase";
import { resolvePendingTurnAction } from "./game-engine/phases/resolve-pending-turn-action";
import { createInitialGameState } from "./game-engine/state/create-initial-game-state";
import { GameState } from "./game-engine/state/types";

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

  public static fuseCards(
    state: GameState,
    playerId: string,
    fusionCardId: string,
    materialInstanceIds: [string, string],
    mode: "ATTACK" | "DEFENSE",
  ): GameState {
    return fuseCards(state, playerId, fusionCardId, materialInstanceIds, mode);
  }

  public static startFusionSummon(
    state: GameState,
    playerId: string,
    fusionCardId: string,
    mode: "ATTACK" | "DEFENSE",
  ): GameState {
    return startFusionSummon(state, playerId, fusionCardId, mode);
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
