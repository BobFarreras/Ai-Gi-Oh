// src/core/use-cases/GameEngine.ts - Fachada del motor de juego que expone casos de uso puros al resto de capas.
import { BattleMode } from "../entities/IPlayer";
import { changeEntityMode } from "./game-engine/actions/change-entity-mode";
import { playCard } from "./game-engine/actions/play-card";
import { playCardWithEntityReplacement } from "./game-engine/actions/play-card-with-entity-replacement";
import { playCardWithZoneReplacement, ReplacementZoneType } from "./game-engine/actions/play-card-with-zone-replacement";
import { resolveExecution } from "./game-engine/actions/resolve-execution";
import { executeAttack } from "./game-engine/combat/execute-attack";
import { fuseCards } from "./game-engine/fusion/fuse-cards";
import { startFusionSummon } from "./game-engine/fusion/start-fusion-summon";
import { nextPhase } from "./game-engine/phases/next-phase";
import { resolvePendingTurnAction } from "./game-engine/phases/resolve-pending-turn-action";
import { createInitialGameState } from "./game-engine/state/create-initial-game-state";
import { GameState } from "./game-engine/state/types";

export type { GameState };

/**
 * Fachada pública del motor de juego para casos de uso puros y testeables.
 */
export class GameEngine {
  /** Crea un estado inicial válido de partida con mazos, mano inicial y jugador inicial. */
  public static createInitialGameState = createInitialGameState;

  /** Juega una carta desde la mano del jugador activo en fase MAIN_1. */
  public static playCard(state: GameState, playerId: string, cardId: string, mode: BattleMode): GameState {
    return playCard(state, playerId, cardId, mode);
  }

  /** Juega una entidad reemplazando otra cuando la zona de entidades está completa. */
  public static playCardWithEntityReplacement(
    state: GameState,
    playerId: string,
    cardId: string,
    mode: BattleMode,
    sacrificedEntityInstanceId: string,
  ): GameState {
    return playCardWithEntityReplacement(state, playerId, cardId, mode, sacrificedEntityInstanceId);
  }

  /** Juega carta con reemplazo explícito de zona (entidades o ejecuciones). */
  public static playCardWithZoneReplacement(
    state: GameState,
    playerId: string,
    cardId: string,
    mode: BattleMode,
    sacrificedEntityInstanceId: string,
    zone: ReplacementZoneType,
  ): GameState {
    return playCardWithZoneReplacement(state, playerId, cardId, mode, sacrificedEntityInstanceId, zone);
  }

  /** Ejecuta una declaración de ataque y resuelve daño, destrucción y trampas reactivas. */
  public static executeAttack(
    state: GameState,
    attackerPlayerId: string,
    attackerInstanceId: string,
    defenderInstanceId?: string,
    options?: { skipReactivePlayerIds?: string[]; skipTrapEventTypes?: ("ATTACK_DECLARED" | "DIRECT_ATTACK_DECLARED")[] },
  ): GameState {
    return executeAttack(state, attackerPlayerId, attackerInstanceId, defenderInstanceId, options);
  }

  /** Resuelve una invocación por fusión estándar desde carta de fusión en mano. */
  public static fuseCards(
    state: GameState,
    playerId: string,
    fusionCardId: string,
    materialInstanceIds: [string, string],
    mode: "ATTACK" | "DEFENSE",
  ): GameState {
    return fuseCards(state, playerId, fusionCardId, materialInstanceIds, mode);
  }

  /** Inicia la acción pendiente de selección de materiales para una fusión manual. */
  public static startFusionSummon(
    state: GameState,
    playerId: string,
    fusionCardId: string,
    mode: "ATTACK" | "DEFENSE",
  ): GameState {
    return startFusionSummon(state, playerId, fusionCardId, mode);
  }

  /** Avanza la fase/turno aplicando mantenimiento, energía y acción obligatoria inicial. */
  public static nextPhase(state: GameState): GameState {
    return nextPhase(state);
  }

  /** Resuelve una ejecución activa y aplica su efecto o acción pendiente derivada. */
  public static resolveExecution(
    state: GameState,
    playerId: string,
    executionInstanceId: string,
    options?: { skipReactivePlayerIds?: string[]; skipTrapEventTypes?: ("EXECUTION_ACTIVATED")[] },
  ): GameState {
    return resolveExecution(state, playerId, executionInstanceId, options);
  }

  /** Resuelve una acción obligatoria pendiente del turno activo. */
  public static resolvePendingTurnAction(state: GameState, playerId: string, selectedId: string): GameState {
    return resolvePendingTurnAction(state, playerId, selectedId);
  }

  /** Cambia el modo de una entidad/ejecución ya desplegada del jugador indicado. */
  public static changeEntityMode(state: GameState, playerId: string, instanceId: string, newMode: BattleMode): GameState {
    return changeEntityMode(state, playerId, instanceId, newMode);
  }
}
