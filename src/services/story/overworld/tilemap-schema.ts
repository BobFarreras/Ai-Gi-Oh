// src/services/story/overworld/tilemap-schema.ts - Contrato versionado del tilemap JSON del overworld Story.
import { OverworldDirection } from "@/core/services/story/overworld/overworld-types";

/**
 * Versión actual del formato. Cualquier cambio incompatible incrementa la versión
 * y añade su migración en el validador para no romper mapas ya publicados.
 */
export const OVERWORLD_TILEMAP_SCHEMA_VERSION = 1;

/**
 * Kinds de objeto interactivo. Mantienen correspondencia 1:1 con la semántica
 * de nodos Story existente para migrar progreso sin fricción.
 */
export type OverworldObjectKind =
  | "DUEL"
  | "BOSS"
  | "REWARD_CARD"
  | "REWARD_NEXUS"
  | "EVENT"
  | "NPC"
  | "SUBMISSION"
  | "WARP"
  | "GATE";

/**
 * Cómo se dispara la interacción: acción explícita estando adyacente
 * (botón A / Espacio) o automáticamente al pisar la celda.
 */
export type OverworldObjectTrigger = "ADJACENT_ACTION" | "STEP_ON";

export type OverworldWarpDirection = "forward" | "backward";

export interface IOverworldTilemapWarpTarget {
  toMapId: string;
  toSpawnId: string;
  direction: OverworldWarpDirection;
}

export interface IOverworldTilemapObject {
  /** Reutiliza los ids de nodo Story actuales (p. ej. `story-ch1-duel-1`) para conservar progreso. */
  id: string;
  kind: OverworldObjectKind;
  tileX: number;
  tileY: number;
  /** Clave del sprite dentro del atlas del mapa. */
  sprite: string;
  trigger: OverworldObjectTrigger;
  /** Ids que deben estar resueltos (visited/interacted/completed) para desbloquear el objeto. */
  gateRequiredNodeIds?: string[];
  /** Solo para kind WARP: destino del teletransporte. */
  warp?: IOverworldTilemapWarpTarget;
  /** Ruta del duelo para kinds DUEL/BOSS (se valida contra el catálogo en runtime, no aquí). */
  duelHref?: string;
  /** Imagen real (avatar/render) a dibujar sobre la plataforma del objeto. Asset interno. */
  imageSrc?: string;
  /** Orientación del oponente (hacia dónde vigila). Solo relevante con visionRange. */
  facing?: OverworldDirection;
  /**
   * Alcance de visión en celdas (estilo Pokémon): si el jugador entra en el haz
   * frontal sin obstáculos, el oponente le reta a combate. Solo DUEL/BOSS.
   */
  visionRange?: number;
  /** Eje de patrulla del rival (si se mueve). Solo DUEL/BOSS. */
  patrolAxis?: "H" | "V";
  /** Longitud del recorrido de patrulla en celdas. Requiere patrolAxis. */
  patrolLength?: number;
}

export interface IOverworldTilemapSpawn {
  id: string;
  tileX: number;
  tileY: number;
  facing: "UP" | "DOWN" | "LEFT" | "RIGHT";
}

/**
 * Capa visual de tiles: matriz height×width de índices dentro del atlas.
 * `0` significa celda vacía (no se dibuja); los índices reales empiezan en 1.
 */
export type OverworldTileLayer = number[][];

export interface IOverworldTilemap {
  schemaVersion: number;
  /** Id estable del mapa (p. ej. `act-1`). */
  id: string;
  /** Acto Story al que pertenece, para soundtrack/briefing/transiciones. */
  act: number;
  /** Tamaño de celda en píxeles (los sprites/tiles se dibujan a esta escala). */
  tileSize: number;
  width: number;
  height: number;
  /**
   * Ruta pública del atlas de tiles/sprites del mapa. Opcional: los mapas con render
   * procedural (sin arte) no lo necesitan; los mapas basados en atlas sí.
   */
  atlasSrc?: string;
  layers: {
    ground: OverworldTileLayer;
    /** Decoración dibujada por encima del personaje para dar profundidad. */
    overlay: OverworldTileLayer;
  };
  /** Matriz height×width: `1` transitable, `0` bloqueado. Formato compacto para JSON. */
  collision: number[][];
  objects: IOverworldTilemapObject[];
  spawns: IOverworldTilemapSpawn[];
  /** Spawn usado al entrar al mapa sin warp explícito. */
  defaultSpawnId: string;
}
