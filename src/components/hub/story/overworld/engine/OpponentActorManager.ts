// src/components/hub/story/overworld/engine/OpponentActorManager.ts - Actores de oponentes: patrulla, línea de visión live y acercamiento antes del combate.
import {
  IGridPosition,
  OverworldDirection,
  resolveDirectionDelta,
} from "@/core/services/story/overworld/overworld-types";
import { ISightlineSource } from "@/core/services/story/overworld/sightline";
import {
  IPatrolConfig,
  IPatrolRuntime,
  PatrolAxis,
  advancePatrol,
} from "@/core/services/story/overworld/resolve-patrol";
import { IOverworldTilemapObject } from "@/services/story/overworld/tilemap-schema";
import { IActiveTileMove } from "@/components/hub/story/overworld/engine/engine-types";

type ActorMode = "IDLE" | "PATROL" | "APPROACH" | "SPENT";

interface IOpponentActor {
  objectId: string;
  spriteSrc?: string;
  accent: string;
  visionRange: number;
  visionRect?: { x0: number; y0: number; x1: number; y1: number };
  tile: IGridPosition;
  facing: OverworldDirection;
  activeMove: IActiveTileMove | null;
  mode: ActorMode;
  patrol?: { config: IPatrolConfig; runtime: IPatrolRuntime; cooldownSeconds: number };
  /** Sentry "barredor": alterna la orientación de vigilancia al rebotar en cada extremo. */
  sweepsVision: boolean;
  approachPath: IGridPosition[];
  approachIndex: number;
}

export interface IOpponentActorRenderData {
  objectId: string;
  pixelX: number;
  pixelY: number;
  tileX: number;
  tileY: number;
  facing: OverworldDirection;
  spriteSrc?: string;
  accent: string;
  visionRange: number;
  showBeam: boolean;
  isDefeated: boolean;
}

/** Color del rival según tipo: el jefe conserva su lila distintivo. */
const DUEL_ACCENT = "#f43f5e";
const BOSS_ACCENT = "#c026d3";

export interface IActorUpdateOptions {
  deltaSeconds: number;
  canEnter: (tile: IGridPosition) => boolean;
  isDefeated: (objectId: string) => boolean;
  isGlobalCutscene: boolean;
}

const PATROL_PAUSE_SECONDS = 0.35;

/**
 * Gestiona los oponentes como entidades dinámicas: quietos, patrullando, o
 * acercándose al jugador antes de la animación de combate. La línea de visión
 * usa su posición/orientación en vivo (un guardia que patrulla barre su haz).
 */
export class OpponentActorManager {
  private readonly actors: IOpponentActor[] = [];
  private readonly tilesPerSecond: number;
  private readonly approachTilesPerSecond: number;
  private approachingObjectId: string | null = null;

  constructor(objects: ReadonlyArray<IOverworldTilemapObject>, tilesPerSecond: number) {
    this.tilesPerSecond = tilesPerSecond;
    this.approachTilesPerSecond = tilesPerSecond * 1.5;
    for (const object of objects) {
      if ((object.kind !== "DUEL" && object.kind !== "BOSS") || !object.facing || !object.visionRange) {
        continue;
      }
      const hasPatrol = Boolean(object.patrolAxis && object.patrolLength);
      this.actors.push({
        objectId: object.id,
        spriteSrc: object.imageSrc,
        accent: object.kind === "BOSS" ? BOSS_ACCENT : DUEL_ACCENT,
        visionRange: object.visionRange,
        visionRect: object.visionRect,
        tile: { tileX: object.tileX, tileY: object.tileY },
        facing: object.facing,
        activeMove: null,
        mode: hasPatrol ? "PATROL" : "IDLE",
        patrol: hasPatrol
          ? {
              config: {
                originX: object.tileX,
                originY: object.tileY,
                axis: object.patrolAxis!,
                length: object.patrolLength!,
              },
              runtime: { index: 0, direction: 1 },
              cooldownSeconds: PATROL_PAUSE_SECONDS,
            }
          : undefined,
        sweepsVision: Boolean(object.patrolSweep),
        approachPath: [],
        approachIndex: 0,
      });
    }
  }

  isApproaching(): boolean {
    return this.approachingObjectId !== null;
  }

  /** Fuentes de visión activas en vivo (excluye derrotados, acercándose o gastados). */
  buildSightlineSources(isDefeated: (objectId: string) => boolean): ISightlineSource[] {
    return this.actors
      .filter(
        (actor) =>
          (actor.mode === "IDLE" || actor.mode === "PATROL") &&
          !actor.activeMove &&
          !isDefeated(actor.objectId),
      )
      .map((actor) => ({
        id: actor.objectId,
        tileX: actor.tile.tileX,
        tileY: actor.tile.tileY,
        facing: actor.facing,
        visionRange: actor.visionRange,
        visionRect: actor.visionRect,
      }));
  }

  /** Inicia el acercamiento del rival hasta la casilla contigua al jugador. */
  startApproach(
    objectId: string,
    playerTile: IGridPosition,
    canEnter: (tile: IGridPosition) => boolean,
  ): void {
    const actor = this.actors.find((entry) => entry.objectId === objectId);
    if (!actor) return;
    const delta = resolveDirectionDelta(actor.facing);
    const path: IGridPosition[] = [];
    let cursor = { ...actor.tile };
    for (let step = 0; step < 24; step++) {
      const next = { tileX: cursor.tileX + delta.tileX, tileY: cursor.tileY + delta.tileY };
      if (next.tileX === playerTile.tileX && next.tileY === playerTile.tileY) break;
      if (!canEnter(next)) break;
      path.push(next);
      cursor = next;
    }
    actor.mode = "APPROACH";
    actor.approachPath = path;
    actor.approachIndex = 0;
    actor.activeMove = null;
    this.approachingObjectId = objectId;
  }

  /**
   * Avanza actores. Devuelve el id del oponente cuyo acercamiento acaba de
   * completarse (momento de lanzar el combate), o `null`.
   */
  update(options: IActorUpdateOptions): string | null {
    let finishedApproachId: string | null = null;
    const canMovePatrol = !options.isGlobalCutscene && this.approachingObjectId === null;
    for (const actor of this.actors) {
      if (actor.mode === "SPENT") continue;
      if (actor.mode === "APPROACH") {
        if (this.advanceApproach(actor, options.deltaSeconds)) finishedApproachId = actor.objectId;
        continue;
      }
      if (options.isDefeated(actor.objectId)) continue;
      this.advancePatrol(actor, options, canMovePatrol);
    }
    return finishedApproachId;
  }

  private advanceApproach(actor: IOpponentActor, deltaSeconds: number): boolean {
    if (actor.activeMove) {
      actor.activeMove.progress += this.approachTilesPerSecond * deltaSeconds;
      if (actor.activeMove.progress >= 1) {
        actor.tile = actor.activeMove.to;
        actor.activeMove = null;
        actor.approachIndex += 1;
      }
      return false;
    }
    if (actor.approachIndex >= actor.approachPath.length) {
      actor.mode = "SPENT";
      this.approachingObjectId = null;
      return true;
    }
    const target = actor.approachPath[actor.approachIndex];
    actor.facing = this.resolveFacingTo(actor.tile, target);
    actor.activeMove = { from: actor.tile, to: target, progress: 0 };
    return false;
  }

  private advancePatrol(actor: IOpponentActor, options: IActorUpdateOptions, canMovePatrol: boolean): void {
    if (actor.activeMove) {
      actor.activeMove.progress += this.tilesPerSecond * options.deltaSeconds;
      if (actor.activeMove.progress >= 1) {
        actor.tile = actor.activeMove.to;
        actor.activeMove = null;
      }
      return;
    }
    if (actor.mode !== "PATROL" || !actor.patrol || !canMovePatrol) return;
    actor.patrol.cooldownSeconds -= options.deltaSeconds;
    if (actor.patrol.cooldownSeconds > 0) return;
    // Sentry: pasea a lo largo del eje manteniendo su orientación de vigilancia
    // perpendicular (el haz barre el corredor en vez de mirar hacia donde camina).
    // Los "barredores" (sweepsVision) alternan ese lado perpendicular al rebotar.
    const previousDirection = actor.patrol.runtime.direction;
    const advance = advancePatrol(actor.patrol.config, actor.patrol.runtime, options.canEnter);
    actor.patrol.cooldownSeconds = PATROL_PAUSE_SECONDS;
    if (advance.target) {
      if (actor.sweepsVision && advance.runtime.direction !== previousDirection) {
        actor.facing = this.flipSweepFacing(actor.facing, actor.patrol.config.axis);
      }
      actor.patrol.runtime = advance.runtime;
      actor.activeMove = { from: actor.tile, to: advance.target, progress: 0 };
    }
  }

  /** Invierte la orientación de vigilancia al lado perpendicular opuesto del eje de patrulla. */
  private flipSweepFacing(facing: OverworldDirection, axis: PatrolAxis): OverworldDirection {
    if (axis === "H") return facing === "UP" ? "DOWN" : "UP";
    return facing === "LEFT" ? "RIGHT" : "LEFT";
  }

  private resolveFacingTo(from: IGridPosition, to: IGridPosition): OverworldDirection {
    if (to.tileX > from.tileX) return "RIGHT";
    if (to.tileX < from.tileX) return "LEFT";
    if (to.tileY > from.tileY) return "DOWN";
    return "UP";
  }

  getRenderData(tileSize: number, isDefeated: (objectId: string) => boolean): IOpponentActorRenderData[] {
    // Los rivales derrotados "se teletransportan": dejan de dibujarse (y su casilla se libera).
    return this.actors.filter((actor) => !isDefeated(actor.objectId)).map((actor) => {
      const pixel = actor.activeMove
        ? {
            x:
              (actor.activeMove.from.tileX +
                (actor.activeMove.to.tileX - actor.activeMove.from.tileX) * actor.activeMove.progress) *
              tileSize,
            y:
              (actor.activeMove.from.tileY +
                (actor.activeMove.to.tileY - actor.activeMove.from.tileY) * actor.activeMove.progress) *
              tileSize,
          }
        : { x: actor.tile.tileX * tileSize, y: actor.tile.tileY * tileSize };
      const defeated = isDefeated(actor.objectId);
      return {
        objectId: actor.objectId,
        pixelX: pixel.x,
        pixelY: pixel.y,
        tileX: actor.tile.tileX,
        tileY: actor.tile.tileY,
        facing: actor.facing,
        spriteSrc: actor.spriteSrc,
        accent: actor.accent,
        visionRange: actor.visionRange,
        showBeam: !defeated && (actor.mode === "IDLE" || actor.mode === "PATROL"),
        isDefeated: defeated,
      };
    });
  }
}
