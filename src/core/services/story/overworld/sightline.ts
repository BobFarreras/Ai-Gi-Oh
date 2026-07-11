// src/core/services/story/overworld/sightline.ts - Detección estilo Pokémon: un oponente reta si el jugador entra en su haz de visión.
import {
  IGridPosition,
  OverworldDirection,
  resolveDirectionDelta,
} from "@/core/services/story/overworld/overworld-types";

export interface ISightlineSource {
  id: string;
  tileX: number;
  tileY: number;
  facing: OverworldDirection;
  visionRange: number;
  /**
   * Aggro de sala: si el jugador está dentro de este rect (celdas inclusivas), el rival reta al
   * instante, sin depender del haz frontal ni de muros. Para jefes que dominan toda su sala.
   */
  visionRect?: { x0: number; y0: number; x1: number; y1: number };
}

export interface IResolveSightlineInput {
  playerTile: IGridPosition;
  sources: ReadonlyArray<ISightlineSource>;
  /** `true` si la vista atraviesa esa celda (suelo libre); un muro la detiene. */
  isTransparent: (tileX: number, tileY: number) => boolean;
  /** `true` si el oponente sigue activo (no derrotado): un rival vencido ya no reta. */
  isSourceActive: (sourceId: string) => boolean;
}

/**
 * Distancia (1..visionRange) a la que un oponente ve al jugador en línea recta,
 * o `null` si no lo ve (fuera de rango, detrás de un muro o de espaldas).
 */
export function resolveSightlineDistance(
  source: ISightlineSource,
  playerTile: IGridPosition,
  isTransparent: (tileX: number, tileY: number) => boolean,
): number | null {
  // Aggro de sala: dentro del rect, reto inmediato (distancia 0 = prioridad máxima).
  if (source.visionRect && isInsideVisionRect(playerTile, source.visionRect)) return 0;
  const delta = resolveDirectionDelta(source.facing);
  let tileX = source.tileX;
  let tileY = source.tileY;
  for (let distance = 1; distance <= source.visionRange; distance++) {
    tileX += delta.tileX;
    tileY += delta.tileY;
    if (tileX === playerTile.tileX && tileY === playerTile.tileY) return distance;
    // La celda debe ser transparente para que la vista continúe más allá.
    if (!isTransparent(tileX, tileY)) return null;
  }
  return null;
}

function isInsideVisionRect(
  tile: IGridPosition,
  rect: { x0: number; y0: number; x1: number; y1: number },
): boolean {
  return tile.tileX >= rect.x0 && tile.tileX <= rect.x1 && tile.tileY >= rect.y0 && tile.tileY <= rect.y1;
}

/**
 * Devuelve el oponente activo que ve al jugador (el más cercano si hay varios),
 * o `null` si nadie lo ve. Es el "reto" estilo Pokémon.
 */
export function resolveTriggeredSightline(input: IResolveSightlineInput): ISightlineSource | null {
  let closest: ISightlineSource | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (const source of input.sources) {
    if (!input.isSourceActive(source.id)) continue;
    const distance = resolveSightlineDistance(source, input.playerTile, input.isTransparent);
    if (distance === null) continue;
    if (distance < closestDistance) {
      closest = source;
      closestDistance = distance;
    }
  }
  return closest;
}
