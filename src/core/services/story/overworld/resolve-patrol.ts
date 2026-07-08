// src/core/services/story/overworld/resolve-patrol.ts - Paso puro de patrulla (pacing con rebote en límites y muros).
import {
  IGridPosition,
  OverworldDirection,
} from "@/core/services/story/overworld/overworld-types";

export type PatrolAxis = "H" | "V";

export interface IPatrolConfig {
  /** Celda de origen (extremo del recorrido con índice 0). */
  originX: number;
  originY: number;
  axis: PatrolAxis;
  /** Longitud en celdas: el índice recorre 0..length. */
  length: number;
}

export interface IPatrolRuntime {
  index: number;
  direction: 1 | -1;
}

export interface IPatrolAdvance {
  runtime: IPatrolRuntime;
  facing: OverworldDirection;
  target: IGridPosition | null;
}

/** Celda del recorrido para un índice dado. */
export function resolvePatrolTile(config: IPatrolConfig, index: number): IGridPosition {
  return config.axis === "H"
    ? { tileX: config.originX + index, tileY: config.originY }
    : { tileX: config.originX, tileY: config.originY + index };
}

function facingFor(axis: PatrolAxis, direction: 1 | -1): OverworldDirection {
  if (axis === "H") return direction === 1 ? "RIGHT" : "LEFT";
  return direction === 1 ? "DOWN" : "UP";
}

/**
 * Avanza la patrulla un paso: sigue la dirección actual y rebota al llegar a un
 * extremo o a una celda no transitable. Determinista y sin estado externo.
 */
export function advancePatrol(
  config: IPatrolConfig,
  runtime: IPatrolRuntime,
  canEnter: (tile: IGridPosition) => boolean,
): IPatrolAdvance {
  for (const direction of [runtime.direction, runtime.direction === 1 ? -1 : 1] as const) {
    const nextIndex = runtime.index + direction;
    if (nextIndex < 0 || nextIndex > config.length) continue;
    const target = resolvePatrolTile(config, nextIndex);
    if (!canEnter(target)) continue;
    return {
      runtime: { index: nextIndex, direction },
      facing: facingFor(config.axis, direction),
      target,
    };
  }
  // Atrapado por ambos lados: se queda quieto mirando su dirección actual.
  return { runtime, facing: facingFor(config.axis, runtime.direction), target: null };
}
