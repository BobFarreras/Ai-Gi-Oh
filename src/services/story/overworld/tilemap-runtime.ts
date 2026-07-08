// src/services/story/overworld/tilemap-runtime.ts - Adapta un tilemap validado a las estructuras puras del motor overworld.
import {
  IOverworldCollisionGrid,
  IOverworldGate,
} from "@/core/services/story/overworld/overworld-types";
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";

/**
 * Convierte la matriz compacta de colisión (0/1) en la rejilla booleana del core.
 */
export function buildCollisionGridFromTilemap(tilemap: IOverworldTilemap): IOverworldCollisionGrid {
  return {
    width: tilemap.width,
    height: tilemap.height,
    walkable: tilemap.collision.map((row) => row.map((cell) => cell === 1)),
  };
}

/**
 * Extrae las puertas lógicas del tilemap: todo objeto con requisitos bloquea su celda
 * hasta que el progreso los resuelva (kind GATE y cualquier objeto gateado).
 */
export function listGatesFromTilemap(tilemap: IOverworldTilemap): IOverworldGate[] {
  return tilemap.objects
    .filter((object) => (object.gateRequiredNodeIds?.length ?? 0) > 0 && object.kind === "GATE")
    .map((object) => ({
      id: object.id,
      tileX: object.tileX,
      tileY: object.tileY,
      requiredNodeIds: object.gateRequiredNodeIds ?? [],
    }));
}
