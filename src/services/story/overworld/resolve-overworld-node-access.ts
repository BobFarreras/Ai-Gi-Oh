// src/services/story/overworld/resolve-overworld-node-access.ts - Acceso server-authoritative a un nodo del overworld según las reglas del propio mapa (gates), no la cadena legacy por-duelo.
import { buildOverworldTilemap } from "@/services/story/overworld/resolve-overworld-tilemap";

/**
 * ¿Puede el jugador iniciar el combate/interacción de este nodo en el overworld?
 *
 * A diferencia del mapa Story legacy (cadena estricta "gana el anterior para
 * desbloquear el siguiente"), el mundo abierto solo bloquea un nodo si su objeto en
 * el tilemap declara `gateRequiredNodeIds` y esos requisitos aún no están completos.
 * En el Acto 1 ningún duelo tiene requisitos → todos son accesibles (el jefe se
 * "protege" físicamente con la visión del guardián, no con una cadena).
 */
export function isOverworldNodeAccessible(
  mapId: string,
  nodeId: string,
  completedNodeIds: ReadonlySet<string>,
): boolean {
  const tilemap = buildOverworldTilemap(mapId);
  if (!tilemap) return false;
  const object = tilemap.objects.find((entry) => entry.id === nodeId);
  if (!object) return false;
  return (object.gateRequiredNodeIds ?? []).every((required) => completedNodeIds.has(required));
}
