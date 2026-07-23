// src/services/story/overworld/act-4-card-forge-cutscene.ts - Escena de la FÁBRICA DE CARTAS (Acto 4, sala del
// terminal). Al llegar a la boca de salida del medio laberinto, el jugador se asoma a una cámara donde GenNvim y
// Midutech, hombro con hombro y de espaldas, miran hacia arriba una máquina que fabrica cartas. Hablan; Midutech
// se lleva la carta suprema y se desmaterializa; GenNvim se gira, sube por el pasillo hasta pegarse al jugador y
// arranca el combate (duel-10).
//
// Estructura idéntica a act-4-hydra-cutscene.ts salvo por dos cosas: hay DOS NPCs (cada paso lleva `npcId`) y la
// narración va DENTRO del guion (paso EVENT), porque las tres líneas se dicen ANTES de que Midutech se marche.
import { OverworldCutsceneStep } from "@/components/hub/story/overworld/engine/engine-types";
import { OverworldDirection } from "@/core/services/story/overworld/overworld-types";
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import {
  CARD_FORGE_GENNVIM_TILE,
  CARD_FORGE_MIDUTECH_TILE,
  CARD_FORGE_TRIGGER_ID,
} from "@/services/story/overworld/act-4-overworld-tilemap";
import { ITileCoordinate, traceWalkableCorridor } from "@/services/story/overworld/trace-walkable-corridor";

const GENNVIM_SPRITE = "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp";
const MIDUTECH_SPRITE = "/assets/story/opponents/opp-ch1-midutech/avatar-Midutech.webp";

/** Ids de actor de la escena (los pasos de cutscene los referencian por `npcId`). */
export const CARD_FORGE_GENNVIM_NPC_ID = "gennvim";
export const CARD_FORGE_MIDUTECH_NPC_ID = "midutech";

function resolveFacing(from: ITileCoordinate, to: ITileCoordinate): OverworldDirection {
  if (to.tileX > from.tileX) return "RIGHT";
  if (to.tileX < from.tileX) return "LEFT";
  if (to.tileY > from.tileY) return "DOWN";
  return "UP";
}

export interface IAct4CardForgeCutsceneOptions {
  /** Pantalla compacta (móvil): se acortan las pausas, que con la cámara alejada se hacen largas. */
  isCompactViewport: boolean;
}

/**
 * Guion de la escena. Devuelve `[]` si el mapa no trae el trigger (la escena pasa entonces directa a la
 * narración + combate, sin aparición).
 */
export function buildAct4CardForgeCutscene(
  tilemap: IOverworldTilemap,
  options: IAct4CardForgeCutsceneOptions,
): OverworldCutsceneStep[] {
  const trigger = tilemap.objects.find((object) => object.id === CARD_FORGE_TRIGGER_ID);
  if (!trigger) return [];
  // Pasillo desde GenNvim hasta la casilla del jugador (el trigger): son las celdas por las que subirá a por él.
  // corridor[0] = GenNvim; el último = el jugador.
  const corridor = traceWalkableCorridor(
    tilemap.collision,
    { tileX: CARD_FORGE_GENNVIM_TILE.tileX, tileY: CARD_FORGE_GENNVIM_TILE.tileY },
    { tileX: trigger.tileX, tileY: trigger.tileY },
  );
  if (corridor.length < 2) return [];
  const pause = options.isCompactViewport ? 0.3 : 0.45;

  const steps: OverworldCutsceneStep[] = [
    // Los dos, de lado, mirando hacia ARRIBA: la máquina está justo encima de ellos.
    {
      kind: "SPAWN_NPC",
      npcId: CARD_FORGE_GENNVIM_NPC_ID,
      tileX: CARD_FORGE_GENNVIM_TILE.tileX,
      tileY: CARD_FORGE_GENNVIM_TILE.tileY,
      facing: "UP",
      spriteSrc: GENNVIM_SPRITE,
    },
    {
      kind: "SPAWN_NPC",
      npcId: CARD_FORGE_MIDUTECH_NPC_ID,
      tileX: CARD_FORGE_MIDUTECH_TILE.tileX,
      tileY: CARD_FORGE_MIDUTECH_TILE.tileY,
      facing: "UP",
      spriteSrc: MIDUTECH_SPRITE,
    },
    { kind: "WAIT", seconds: pause },
    // Las tres líneas de los villanos, todavía sin haberte visto.
    { kind: "EVENT", nodeId: CARD_FORGE_TRIGGER_ID },
    // "Voy a llevármela": Midutech se desmaterializa con la carta rumbo a la sala de arriba.
    { kind: "DESPAWN_NPC", npcId: CARD_FORGE_MIDUTECH_NPC_ID, effect: "TELEPORT" },
    { kind: "WAIT", seconds: pause },
  ];
  // GenNvim se gira y sube por el pasillo hasta quedarse pegado al jugador (una casilla antes de la suya).
  const stopIndex = corridor.length - 2;
  steps.push({
    kind: "NPC_FACE",
    npcId: CARD_FORGE_GENNVIM_NPC_ID,
    direction: resolveFacing(corridor[0], corridor[1]),
  });
  // Un WALK_TO por casilla: el pasillo gira y el motor sólo sabe andar en línea recta.
  for (let index = 1; index <= stopIndex; index++) {
    steps.push({
      kind: "NPC_WALK_TO",
      npcId: CARD_FORGE_GENNVIM_NPC_ID,
      tileX: corridor[index].tileX,
      tileY: corridor[index].tileY,
    });
  }
  // El jugador miraba hacia la salida: se gira hacia él antes de que hable.
  steps.push({ kind: "PLAYER_FACE", direction: resolveFacing(corridor[corridor.length - 1], corridor[stopIndex]) });
  steps.push({ kind: "WAIT", seconds: pause });
  return steps;
}
