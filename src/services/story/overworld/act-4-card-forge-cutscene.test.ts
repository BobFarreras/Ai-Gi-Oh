// src/services/story/overworld/act-4-card-forge-cutscene.test.ts - Blinda la escena de la Fábrica de Cartas:
// los DOS villanos aparecen hombro con hombro mirando la máquina, las tres líneas se dicen antes de que Midutech
// se lleve la carta, y GenNvim sube por el pasillo (sin atravesar muros) hasta pegarse al jugador.
import {
  CARD_FORGE_GENNVIM_NPC_ID,
  CARD_FORGE_MIDUTECH_NPC_ID,
  buildAct4CardForgeCutscene,
} from "@/services/story/overworld/act-4-card-forge-cutscene";
import {
  CARD_FORGE_GENNVIM_TILE,
  CARD_FORGE_MIDUTECH_TILE,
  CARD_FORGE_TRIGGER_ID,
  buildAct4OverworldTilemap,
} from "@/services/story/overworld/act-4-overworld-tilemap";

function triggerTile() {
  const trigger = buildAct4OverworldTilemap().objects.find((object) => object.id === CARD_FORGE_TRIGGER_ID)!;
  return { tileX: trigger.tileX, tileY: trigger.tileY };
}

function stepsFor(isCompactViewport = false) {
  return buildAct4CardForgeCutscene(buildAct4OverworldTilemap(), { isCompactViewport });
}

describe("buildAct4CardForgeCutscene", () => {
  it("saca a los DOS villanos, de lado y mirando hacia ARRIBA (a la máquina)", () => {
    const spawns = stepsFor().filter((step) => step.kind === "SPAWN_NPC");
    expect(spawns).toHaveLength(2);
    for (const spawn of spawns) {
      expect(spawn.kind === "SPAWN_NPC" && spawn.facing).toBe("UP");
    }
    const byId = new Map(spawns.map((step) => [step.kind === "SPAWN_NPC" ? step.npcId : "", step]));
    const gennvim = byId.get(CARD_FORGE_GENNVIM_NPC_ID)!;
    const midutech = byId.get(CARD_FORGE_MIDUTECH_NPC_ID)!;
    expect(gennvim.kind === "SPAWN_NPC" && gennvim.tileX).toBe(CARD_FORGE_GENNVIM_TILE.tileX);
    expect(midutech.kind === "SPAWN_NPC" && midutech.tileX).toBe(CARD_FORGE_MIDUTECH_TILE.tileX);
    // Hombro con hombro: misma fila y casillas contiguas.
    expect(CARD_FORGE_GENNVIM_TILE.tileY).toBe(CARD_FORGE_MIDUTECH_TILE.tileY);
    expect(Math.abs(CARD_FORGE_GENNVIM_TILE.tileX - CARD_FORGE_MIDUTECH_TILE.tileX)).toBe(1);
  });

  it("narra las tres líneas ANTES de que Midutech se lleve la carta y se desmaterialice", () => {
    const steps = stepsFor();
    const eventIndex = steps.findIndex((step) => step.kind === "EVENT");
    const despawnIndex = steps.findIndex((step) => step.kind === "DESPAWN_NPC");
    expect(eventIndex).toBeGreaterThan(-1);
    expect(despawnIndex).toBeGreaterThan(eventIndex);
    const despawn = steps[despawnIndex];
    expect(despawn.kind === "DESPAWN_NPC" && despawn.npcId).toBe(CARD_FORGE_MIDUTECH_NPC_ID);
    expect(despawn.kind === "DESPAWN_NPC" && despawn.effect).toBe("TELEPORT");
    // GenNvim se queda: nadie lo despawnea.
    expect(
      steps.some((step) => step.kind === "DESPAWN_NPC" && step.npcId === CARD_FORGE_GENNVIM_NPC_ID),
    ).toBe(false);
  });

  it("GenNvim se gira y sube hasta la casilla contigua al jugador, cortándole la salida", () => {
    const player = triggerTile();
    const steps = stepsFor();
    expect(steps.some((step) => step.kind === "NPC_FACE" && step.npcId === CARD_FORGE_GENNVIM_NPC_ID)).toBe(true);
    const walks = steps.filter((step) => step.kind === "NPC_WALK_TO");
    expect(walks.length).toBeGreaterThan(0);
    const last = walks[walks.length - 1];
    expect(
      last.kind === "NPC_WALK_TO" && Math.abs(last.tileX - player.tileX) + Math.abs(last.tileY - player.tileY),
    ).toBe(1);
    // Todos los pasos son de GenNvim (Midutech ya no está).
    for (const walk of walks) expect(walk.kind === "NPC_WALK_TO" && walk.npcId).toBe(CARD_FORGE_GENNVIM_NPC_ID);
  });

  it("el recorrido son casillas transitables contiguas: no atraviesa los muros del medio laberinto", () => {
    const tilemap = buildAct4OverworldTilemap();
    const steps = buildAct4CardForgeCutscene(tilemap, { isCompactViewport: false });
    let cursor: { tileX: number; tileY: number } = {
      tileX: CARD_FORGE_GENNVIM_TILE.tileX,
      tileY: CARD_FORGE_GENNVIM_TILE.tileY,
    };
    expect(tilemap.collision[cursor.tileY][cursor.tileX]).toBe(1);
    for (const step of steps) {
      if (step.kind !== "NPC_WALK_TO") continue;
      expect(Math.abs(step.tileX - cursor.tileX) + Math.abs(step.tileY - cursor.tileY)).toBe(1);
      expect(tilemap.collision[step.tileY][step.tileX]).toBe(1);
      cursor = { tileX: step.tileX, tileY: step.tileY };
    }
  });

  it("gira al jugador hacia GenNvim antes de que hable", () => {
    expect(stepsFor().some((step) => step.kind === "PLAYER_FACE")).toBe(true);
  });

  it("sin trigger en el mapa devuelve un guion vacío (la escena pasa directa al combate)", () => {
    const tilemap = buildAct4OverworldTilemap();
    const stripped = { ...tilemap, objects: tilemap.objects.filter((object) => object.id !== CARD_FORGE_TRIGGER_ID) };
    expect(buildAct4CardForgeCutscene(stripped, { isCompactViewport: false })).toEqual([]);
  });
});
