// src/services/story/overworld/resolve-overworld-tilemap.ts - Registro central de tilemaps del overworld por mapId (mismo motor, varios mapas/actos).
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import { buildAct1OverworldTilemap } from "@/services/story/overworld/act-1-overworld-tilemap";
import { buildAct2OverworldTilemap } from "@/services/story/overworld/act-2-overworld-tilemap";
import { buildAct3OverworldTilemap } from "@/services/story/overworld/act-3-overworld-tilemap";
import { buildAct4OverworldTilemap } from "@/services/story/overworld/act-4-overworld-tilemap";

/** mapId -> constructor del tilemap. Añadir aquí cada acto nuevo. */
const TILEMAP_BUILDERS: Record<string, () => IOverworldTilemap> = {
  "act-1": buildAct1OverworldTilemap,
  "act-2": buildAct2OverworldTilemap,
  "act-3": buildAct3OverworldTilemap,
  "act-4": buildAct4OverworldTilemap,
};

/** mapId por defecto al entrar al overworld sin estado guardado. */
export const DEFAULT_OVERWORLD_MAP_ID = "act-1";

/** ¿Existe un tilemap para este mapId? */
export function isKnownOverworldMap(mapId: string): boolean {
  return mapId in TILEMAP_BUILDERS;
}

/** Construye el tilemap del mapId, o `null` si no existe. */
export function buildOverworldTilemap(mapId: string): IOverworldTilemap | null {
  return TILEMAP_BUILDERS[mapId]?.() ?? null;
}

/** Acto (número) al que pertenece el mapId, para soundtrack/briefing. `act-1` -> 1. */
export function resolveOverworldActId(mapId: string): number {
  const match = /act-(\d+)/.exec(mapId);
  return match ? Number.parseInt(match[1], 10) : 1;
}
