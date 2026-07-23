// src/services/story/overworld/tilemap-schema.ts - Contrato versionado del tilemap JSON del overworld Story.
import { OverworldDirection } from "@/core/services/story/overworld/overworld-types";

/**
 * Versión actual del formato. Cualquier cambio incompatible incrementa la versión
 * y añade su migración en el validador para no romper mapas ya publicados.
 *
 * v2: mecánicas interactivas del Acto 3+ (oscuridad/luces, cajas empujables, placas,
 * cintas). Todos los campos nuevos son opcionales, así que los mapas v1 solo suben el
 * literal de versión.
 */
export const OVERWORLD_TILEMAP_SCHEMA_VERSION = 2;

/**
 * Kinds de objeto interactivo. Mantienen correspondencia 1:1 con la semántica
 * de nodos Story existente para migrar progreso sin fricción.
 */
export type OverworldObjectKind =
  | "DUEL"
  | "BOSS"
  | "REWARD_CARD"
  | "REWARD_NEXUS"
  | "REWARD_OBJECT"
  | "EVENT"
  | "NPC"
  | "SUBMISSION"
  | "WARP"
  | "GATE"
  | "MARKET"
  | "ARSENAL"
  | "TELEPORT"
  // v2 — mecánicas interactivas:
  | "SWITCH" // interruptor de luz (ilumina una sala oscura al activarse).
  | "BOX" // caja empujable (bloque sokoban).
  | "PLATE" // placa de presión (se "pulsa" con una caja encima; abre un GATE en vivo).
  | "BOX_RESET"; // botón que devuelve las cajas a su posición inicial (anti soft-lock).

/**
 * Ambiente visual del mapa.
 * - `DARK` activa el pase de oscuridad + radios de luz (Acto 3).
 * - `TERMINAL` tiñe el mundo de verde fósforo ciberpunk (Acto 4, GenNvim): rejilla neón verde y scanlines.
 */
export type OverworldAmbient = "NORMAL" | "DARK" | "TERMINAL";

/** Rectángulo de celdas (inclusivo) que un interruptor ilumina por completo. */
export interface IOverworldLightRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Cómo se dispara la interacción: acción explícita estando adyacente
 * (botón A / Espacio) o automáticamente al pisar la celda.
 */
export type OverworldObjectTrigger = "ADJACENT_ACTION" | "STEP_ON" | "BUMP";

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
  /**
   * Aggro de sala (solo DUEL/BOSS): si el jugador entra en este rect, el rival reta al instante
   * (además de su haz frontal). Ideal para jefes: entrar en su sala = combate garantizado.
   */
  visionRect?: IOverworldLightRect;
  /** Eje de patrulla del rival (si se mueve). Solo DUEL/BOSS. */
  patrolAxis?: "H" | "V";
  /** Longitud del recorrido de patrulla en celdas. Requiere patrolAxis. */
  patrolLength?: number;
  /**
   * Sentry "barredor": al rebotar en cada extremo del recorrido alterna su
   * orientación de vigilancia al lado perpendicular opuesto (p. ej. UP↔DOWN en
   * un eje H), abriendo huecos móviles más divertidos de esquivar. Requiere patrol.
   */
  patrolSweep?: boolean;
  /** Trigger invisible (un "recuadro" del suelo): no se dibuja token ni en minimapa. */
  hidden?: boolean;
  // ── v2: mecánicas interactivas ──────────────────────────────────────────────
  /**
   * Solo SWITCH: radio de luz (en celdas) que abre en la oscuridad al activarse.
   * Si se omite y no hay `lightRect`, se usa un radio por defecto.
   */
  lightRadius?: number;
  /** Solo SWITCH: sala completa (rect de celdas) que se ilumina al activarse. */
  lightRect?: IOverworldLightRect;
  /**
   * Solo SWITCH: rect de casillas-cinta cuyo sentido se INVIERTE mientras el interruptor está accionado
   * (belt-toggle). Un botón en una sala puede así abrir/cerrar el paso por una pasarela de otra sala.
   */
  beltToggleRect?: IOverworldLightRect;
  /**
   * Solo SWITCH/PLATE con `beltToggleRect`: QUÉ posición manda este interruptor. `INVERT` deja la cinta al revés
   * de su sentido base; `RESTORE` (por defecto en el gemelo de vuelta) la devuelve al base. Dos interruptores
   * sobre el mismo rect con modos opuestos forman UNA palanca de dos posiciones: siempre hay exactamente uno
   * encendido, y volver a pulsar el que ya manda no hace nada.
   */
  beltToggleMode?: "INVERT" | "RESTORE";
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
  /**
   * Ambiente lumínico (v2). `DARK` activa el pase de oscuridad: solo se ve un radio
   * alrededor del jugador y de los interruptores encendidos. Default `NORMAL`.
   */
  ambient?: OverworldAmbient;
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
