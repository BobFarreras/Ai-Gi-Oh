// src/services/story/overworld/act-4-hydra-cutscene.ts - Emboscada de GenNvim (duel-8) en el pasillo de la carta
// Hydra (maze leftUp del Acto 4). El pasillo está vacío: al pisar el trigger oculto (2 casillas antes de poder
// coger la carta) GenNvim aparece POR DETRÁS, corta la retirada y arranca el combate.
//
// Por qué dos guiones según pantalla:
//  - MÓVIL: la cámara va alejada pero el viewport es estrecho (se ven ~3 casillas a cada lado), así que entra
//    ANDANDO desde el fondo del pasillo: nace fuera de cámara y aparece caminando, que es lo natural.
//  - DESKTOP: se ve media sala de golpe; verle salir de la habitación de al lado y cruzar medio laberinto queda
//    cutre y lento. Se materializa (TELEPORT) en el mismo pasillo, a un paso, y avanza hasta el jugador.
import { OverworldCutsceneStep } from "@/components/hub/story/overworld/engine/engine-types";
import { OverworldDirection } from "@/core/services/story/overworld/overworld-types";
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import {
  HYDRA_AMBUSH_TRIGGER_ID,
  HYDRA_MAZE_ENTRY_TILE,
} from "@/services/story/overworld/act-4-overworld-tilemap";
import { ITileCoordinate, traceWalkableCorridor } from "@/services/story/overworld/trace-walkable-corridor";

const GENNVIM_SPRITE = "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp";

/** Casillas de pasillo por detrás del jugador donde nace GenNvim, según el guion. */
const WALK_IN_DISTANCE = 5; // móvil: fuera de cámara, entra andando.
const TELEPORT_DISTANCE = 2; // desktop: se materializa a la vista, a un paso del jugador.

function resolveFacing(from: ITileCoordinate, to: ITileCoordinate): OverworldDirection {
  if (to.tileX > from.tileX) return "RIGHT";
  if (to.tileX < from.tileX) return "LEFT";
  if (to.tileY > from.tileY) return "DOWN";
  return "UP";
}

export interface IAct4HydraCutsceneOptions {
  /** Pantalla compacta (móvil): entra andando en vez de teletransportarse. */
  isCompactViewport: boolean;
}

/**
 * Guion de la emboscada. Devuelve `[]` si el mapa no trae el trigger o el pasillo no da de sí (la escena
 * entonces pasa directa a la narración + combate, sin aparición).
 */
export function buildAct4HydraAmbushCutscene(
  tilemap: IOverworldTilemap,
  options: IAct4HydraCutsceneOptions,
): OverworldCutsceneStep[] {
  const trigger = tilemap.objects.find((object) => object.id === HYDRA_AMBUSH_TRIGGER_ID);
  if (!trigger) return [];
  // Pasillo desde la casilla del jugador (el trigger) hacia la boca del laberinto: son las celdas que
  // quedan A SU ESPALDA, en orden de cercanía. corridor[0] es el propio jugador.
  const corridor = traceWalkableCorridor(
    tilemap.collision,
    { tileX: trigger.tileX, tileY: trigger.tileY },
    HYDRA_MAZE_ENTRY_TILE,
  );
  if (corridor.length < 2) return [];

  const stopTile = corridor[1]; // se planta pegado al jugador, cortándole la salida.
  const desiredDistance = options.isCompactViewport ? WALK_IN_DISTANCE : TELEPORT_DISTANCE;
  const spawnIndex = Math.min(desiredDistance, corridor.length - 1);
  const spawnTile = corridor[spawnIndex];

  const steps: OverworldCutsceneStep[] = [
    {
      kind: "SPAWN_NPC",
      tileX: spawnTile.tileX,
      tileY: spawnTile.tileY,
      facing: resolveFacing(spawnTile, corridor[spawnIndex - 1]),
      spriteSrc: GENNVIM_SPRITE,
      ...(options.isCompactViewport ? {} : { effect: "TELEPORT" as const }),
    },
    { kind: "WAIT", seconds: options.isCompactViewport ? 0.2 : 0.35 },
  ];
  // Un WALK_TO por casilla: en un laberinto los tramos giran, y el motor solo sabe andar en línea recta.
  for (let index = spawnIndex - 1; index >= 1; index--) {
    steps.push({ kind: "NPC_WALK_TO", tileX: corridor[index].tileX, tileY: corridor[index].tileY });
  }
  // El jugador iba de espaldas (bajando hacia la carta): se gira hacia él antes de que hable.
  steps.push({ kind: "PLAYER_FACE", direction: resolveFacing(corridor[0], stopTile) });
  steps.push({ kind: "WAIT", seconds: 0.35 });
  return steps;
}
