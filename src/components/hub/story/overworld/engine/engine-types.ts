// src/components/hub/story/overworld/engine/engine-types.ts - Tipos internos del motor imperativo del overworld.
import {
  IGridPosition,
  OverworldDirection,
} from "@/core/services/story/overworld/overworld-types";
import { IResolvedMovementContext } from "@/core/services/story/overworld/movement-rules";
import { IOverworldTilemap, IOverworldTilemapObject } from "@/services/story/overworld/tilemap-schema";

/**
 * Intención emitida por el motor cuando el jugador interactúa con un objeto.
 * React la recibe por el puente y decide qué hacer (duelo, diálogo, recompensa, warp),
 * reutilizando los sistemas Story ya existentes.
 */
export interface IOverworldIntent {
  object: IOverworldTilemapObject;
  isBlocked: boolean;
  missingRequirements: string[];
  source: "ACTION" | "STEP_ON" | "SIGHTLINE" | "BUMP";
}

/**
 * Objeto actualmente enfocado (o `null`), para que la UI muestre el prompt contextual.
 */
export interface IOverworldFocus {
  object: IOverworldTilemapObject;
  isBlocked: boolean;
}

/**
 * Pasos de una cutscene guionizada (intro, apariciones de NPC, etc.).
 */
export type OverworldCutsceneStep =
  | { kind: "WAIT"; seconds: number }
  | { kind: "PLAYER_STEP"; direction: OverworldDirection }
  | { kind: "PLAYER_FACE"; direction: OverworldDirection }
  | {
      kind: "SPAWN_NPC";
      tileX: number;
      tileY: number;
      facing: OverworldDirection;
      spriteSrc: string;
      /**
       * `TELEPORT` materializa al NPC en la casilla (anillo + glitch) en vez de aparecer de golpe.
       * Se usa cuando no hay sitio para que entre andando desde fuera de cámara.
       */
      effect?: "TELEPORT";
    }
  | { kind: "NPC_WALK_TO"; tileX: number; tileY: number }
  | { kind: "EVENT"; nodeId: string }
  | { kind: "DESPAWN_NPC" };

/** Duración (s) de la materialización de un SPAWN_NPC con efecto TELEPORT. */
export const CUTSCENE_TELEPORT_SECONDS = 0.7;

/** Datos de render del NPC de cutscene (posición interpolada en píxeles). */
export interface IOverworldCutsceneNpcRender {
  pixelX: number;
  pixelY: number;
  facing: OverworldDirection;
  spriteSrc: string;
  /** Avance de la materialización 0..1 (1 = ya sólido; los spawns sin efecto nacen en 1). */
  spawnProgress: number;
}

/** Datos de render del efecto de recolección (el objeto se encoge hacia el jugador + valor flotante). */
export interface IOverworldCollectEffectRender {
  imageSrc?: string;
  x: number;
  y: number;
  size: number;
  alpha: number;
  label: string | null;
  labelX: number;
  labelY: number;
  labelAlpha: number;
}

/**
 * Interpolación en curso entre dos celdas (posición visual en píxeles).
 */
export interface IActiveTileMove {
  from: IGridPosition;
  to: IGridPosition;
  /** Avance normalizado 0..1 dentro del paso actual. */
  progress: number;
}

/**
 * Estado mutable del jugador dentro del engine. Vive fuera de React a propósito:
 * cambia a 60 Hz y no debe provocar re-renders.
 */
export interface IEnginePlayerState {
  tile: IGridPosition;
  facing: OverworldDirection;
  activeMove: IActiveTileMove | null;
}

export interface IEngineWorldState {
  tilemap: IOverworldTilemap;
  movementContext: IResolvedMovementContext;
  player: IEnginePlayerState;
}

export interface IOverworldEngineConfig {
  /** Velocidad de locomoción en celdas por segundo. */
  tilesPerSecond: number;
  /** Límite de devicePixelRatio para proteger el fill-rate en móviles densos. */
  maxDevicePixelRatio: number;
  /** Imagen del avatar del jugador dibujada en el canvas. */
  playerImageSrc: string;
  /** Zoom de cámara: >1 acerca (se ve menos mapa, estilo Pokémon). */
  zoom: number;
  /** Posición inicial (si se restaura tras un duelo); si no, usa el spawn del mapa. */
  initialPosition?: IGridPosition | null;
  /** Cutscene a reproducir al arrancar (p. ej. la intro). */
  introCutscene?: OverworldCutsceneStep[] | null;
  /** Recompensas ya recogidas (no se dibujan; se restauran del servidor). */
  collectedNodeIds?: string[] | null;
}

export const DEFAULT_ENGINE_CONFIG: IOverworldEngineConfig = {
  tilesPerSecond: 6,
  maxDevicePixelRatio: 2,
  playerImageSrc: "/assets/story/player/bob.webp",
  zoom: 1.85,
  initialPosition: null,
  introCutscene: null,
  collectedNodeIds: null,
};

/** Paso fijo de simulación (60 Hz) desacoplado del framerate de render. */
export const FIXED_TIMESTEP_MS = 1000 / 60;

/** Techo de acumulación para evitar la espiral de la muerte en dispositivos lentos. */
export const MAX_ACCUMULATED_MS = 250;
