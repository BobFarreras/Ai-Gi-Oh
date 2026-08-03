// src/core/use-cases/GameEngine.ts - Fachada del motor de juego que expone casos de uso puros al resto de capas.
import { BattleMode } from "../entities/IPlayer";
import { changeEntityMode } from "./game-engine/actions/change-entity-mode";
import { playCard } from "./game-engine/actions/play-card";
import { playCardWithEntityReplacement } from "./game-engine/actions/play-card-with-entity-replacement";
import { discardBoardCardForZoneReplacement, playCardWithZoneReplacement, ReplacementZoneType } from "./game-engine/actions/play-card-with-zone-replacement";
import { resolveExecution } from "./game-engine/actions/resolve-execution";
import { executeAttack } from "./game-engine/combat/execute-attack";
import { resolveReactiveTrapDecision } from "./game-engine/combat/resolve-reactive-trap-decision";
import { fuseCards } from "./game-engine/fusion/fuse-cards";
import { startFusionSummon } from "./game-engine/fusion/start-fusion-summon";
import { nextPhase } from "./game-engine/phases/next-phase";
import { mulliganOpeningHand } from "./game-engine/state/mulligan-opening-hand";
import { RandomSource } from "@/core/services/random/seeded-rng";
import { resolvePendingTurnAction } from "./game-engine/phases/resolve-pending-turn-action";
import { createInitialGameState } from "./game-engine/state/create-initial-game-state";
import { GameState } from "./game-engine/state/types";
import { cancelUnresolvablePendingTurnAction } from "./game-engine/phases/cancel-unresolvable-pending-turn-action";

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

  /** Solo el sacrificio del reemplazo de zona (envía la carta al cementerio); la nueva se juega aparte. */
  public static discardBoardCardForZoneReplacement(
    state: GameState,
    playerId: string,
    sacrificedEntityInstanceId: string,
    zone: ReplacementZoneType,
  ): GameState {
    return discardBoardCardForZoneReplacement(state, playerId, sacrificedEntityInstanceId, zone);
  }

  /** Ejecuta una declaración de ataque y resuelve daño, destrucción y trampas reactivas. */
  public static executeAttack(
    state: GameState,
    attackerPlayerId: string,
    attackerInstanceId: string,
    defenderInstanceId?: string,
    options?: { skipReactivePlayerIds?: string[]; skipTrapEventTypes?: ("ATTACK_DECLARED" | "DIRECT_ATTACK_DECLARED")[]; skipCounterTrapPlayerIds?: string[]; chosenTrapInstanceId?: string; deferReactiveTraps?: boolean },
  ): GameState {
    return executeAttack(state, attackerPlayerId, attackerInstanceId, defenderInstanceId, options);
  }

  /**
   * Ficha 4 (multi): continúa un ataque pausado con la decisión de trampa reactiva del defensor (activar la
   * elegida o pasar). Ambos clientes aplican esta acción y convergen al mismo estado.
   */
  public static resolveReactiveTrapDecision(
    state: GameState,
    defenderPlayerId: string,
    decision: { activate: boolean; chosenTrapInstanceId?: string },
  ): GameState {
    return resolveReactiveTrapDecision(state, defenderPlayerId, decision);
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

  /** Rebaraja la mano de apertura del jugador (habilidad OPENING_MULLIGAN, PvE). No toca al rival. */
  public static mulliganOpeningHand(state: GameState, playerId: string, randomSource: RandomSource): GameState {
    return mulliganOpeningHand(state, playerId, randomSource);
  }

  /** Resuelve una ejecución activa y aplica su efecto o acción pendiente derivada. */
  public static resolveExecution(
    state: GameState,
    playerId: string,
    executionInstanceId: string,
    options?: { skipReactivePlayerIds?: string[]; skipTrapEventTypes?: ("EXECUTION_ACTIVATED")[]; skipCounterTrapPlayerIds?: string[]; chosenTrapInstanceId?: string },
  ): GameState {
    return resolveExecution(state, playerId, executionInstanceId, options);
  }

  /** Resuelve una acción obligatoria pendiente del turno activo. */
  public static resolvePendingTurnAction(state: GameState, playerId: string, selectedId: string): GameState {
    return resolvePendingTurnAction(state, playerId, selectedId);
  }

  /** Recupera un turno automático cuando una acción pendiente ya no tiene candidatos legales. */
  public static cancelUnresolvablePendingTurnAction(state: GameState, playerId: string): GameState {
    return cancelUnresolvablePendingTurnAction(state, playerId);
  }

  /** Cambia el modo de una entidad/ejecución ya desplegada del jugador indicado. */
  public static changeEntityMode(state: GameState, playerId: string, instanceId: string, newMode: BattleMode): GameState {
    return changeEntityMode(state, playerId, instanceId, newMode);
  }
}
