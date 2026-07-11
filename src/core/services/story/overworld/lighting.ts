// src/core/services/story/overworld/lighting.ts - Reglas puras de iluminación del overworld (mapas oscuros + interruptores).

/**
 * Foco de luz que "perfora" la oscuridad. Dos formas:
 *  - RADIAL: círculo suave (jugador, interruptor sin sala definida).
 *  - RECT: sala completa (rect de celdas) que se enciende de golpe.
 * Las coordenadas están en celdas; el renderer las convierte a píxeles.
 */
export interface IOverworldRadialLight {
  kind: "RADIAL";
  tileX: number;
  tileY: number;
  /** Radio en celdas. */
  radius: number;
}

export interface IOverworldRectLight {
  kind: "RECT";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type IOverworldLight = IOverworldRadialLight | IOverworldRectLight;

/**
 * Fuente de luz de un interruptor: se enciende cuando su `id` está en el progreso
 * (marcado como interactuado). El motor construye esta lista desde los objetos SWITCH.
 */
export interface ISwitchLightSource {
  id: string;
  light: IOverworldLight;
}

/** Radio por defecto de un interruptor que no declara ni radio ni rect. */
export const DEFAULT_SWITCH_LIGHT_RADIUS = 4;

/**
 * Devuelve las luces activas: las de los interruptores ya accionados (interacted).
 * Pura y determinista; la luz del jugador la añade el renderer aparte (sigue al avatar).
 */
export function resolveActiveLights(
  sources: ReadonlyArray<ISwitchLightSource>,
  interactedNodeIds: ReadonlySet<string>,
): IOverworldLight[] {
  const lights: IOverworldLight[] = [];
  for (const source of sources) {
    if (interactedNodeIds.has(source.id)) lights.push(source.light);
  }
  return lights;
}

/** ¿Está la celda dentro de algún foco de luz activo? Útil para lógica/tests (no para render). */
export function isTileLit(
  position: { tileX: number; tileY: number },
  lights: ReadonlyArray<IOverworldLight>,
): boolean {
  for (const light of lights) {
    if (light.kind === "RECT") {
      if (
        position.tileX >= light.x0 &&
        position.tileX <= light.x1 &&
        position.tileY >= light.y0 &&
        position.tileY <= light.y1
      ) {
        return true;
      }
    } else {
      const dx = position.tileX - light.tileX;
      const dy = position.tileY - light.tileY;
      if (dx * dx + dy * dy <= light.radius * light.radius) return true;
    }
  }
  return false;
}
