// src/services/story/overworld/act-4-hydra-cutscene.test.ts - Blinda la emboscada de GenNvim (duel-8): aparece
// SIEMPRE por detrás del jugador y termina pegado a él, con teletransporte en desktop y entrada andando en móvil.
import { buildAct4HydraAmbushCutscene } from "@/services/story/overworld/act-4-hydra-cutscene";
import {
  HYDRA_AMBUSH_TRIGGER_ID,
  buildAct4OverworldTilemap,
} from "@/services/story/overworld/act-4-overworld-tilemap";

function triggerTile() {
  const trigger = buildAct4OverworldTilemap().objects.find((object) => object.id === HYDRA_AMBUSH_TRIGGER_ID)!;
  return { tileX: trigger.tileX, tileY: trigger.tileY };
}

function stepsFor(isCompactViewport: boolean) {
  return buildAct4HydraAmbushCutscene(buildAct4OverworldTilemap(), { isCompactViewport });
}

describe("buildAct4HydraAmbushCutscene", () => {
  it("en desktop se MATERIALIZA en el pasillo (no cruza el laberinto andando)", () => {
    const steps = stepsFor(false);
    const spawn = steps.find((step) => step.kind === "SPAWN_NPC")!;
    expect(spawn.kind === "SPAWN_NPC" && spawn.effect).toBe("TELEPORT");
    // Un solo paso: aparece a la vista y avanza hasta el jugador.
    expect(steps.filter((step) => step.kind === "NPC_WALK_TO")).toHaveLength(1);
  });

  it("en móvil entra ANDANDO desde fuera de cámara (varias casillas de pasillo)", () => {
    const steps = stepsFor(true);
    const spawn = steps.find((step) => step.kind === "SPAWN_NPC")!;
    expect(spawn.kind === "SPAWN_NPC" && spawn.effect).toBeUndefined();
    expect(steps.filter((step) => step.kind === "NPC_WALK_TO").length).toBeGreaterThan(2);
  });

  it("en ambos modos acaba en la casilla contigua al jugador (le corta la retirada)", () => {
    const player = triggerTile();
    for (const isCompact of [true, false]) {
      const steps = stepsFor(isCompact);
      const walks = steps.filter((step) => step.kind === "NPC_WALK_TO");
      const last = walks[walks.length - 1];
      expect(last.kind === "NPC_WALK_TO" && Math.abs(last.tileX - player.tileX) + Math.abs(last.tileY - player.tileY)).toBe(1);
    }
  });

  it("todos los tramos del recorrido son casillas transitables contiguas (no atraviesa muros del maze)", () => {
    const tilemap = buildAct4OverworldTilemap();
    for (const isCompact of [true, false]) {
      const steps = buildAct4HydraAmbushCutscene(tilemap, { isCompactViewport: isCompact });
      const spawn = steps.find((step) => step.kind === "SPAWN_NPC")!;
      let cursor = spawn.kind === "SPAWN_NPC" ? { tileX: spawn.tileX, tileY: spawn.tileY } : { tileX: 0, tileY: 0 };
      expect(tilemap.collision[cursor.tileY][cursor.tileX]).toBe(1);
      for (const step of steps) {
        if (step.kind !== "NPC_WALK_TO") continue;
        expect(Math.abs(step.tileX - cursor.tileX) + Math.abs(step.tileY - cursor.tileY)).toBe(1);
        expect(tilemap.collision[step.tileY][step.tileX]).toBe(1);
        cursor = { tileX: step.tileX, tileY: step.tileY };
      }
    }
  });

  it("gira al jugador hacia el rival antes de que hable", () => {
    const steps = stepsFor(false);
    expect(steps.some((step) => step.kind === "PLAYER_FACE")).toBe(true);
  });

  it("sin trigger en el mapa devuelve un guion vacío (la escena pasa directa al combate)", () => {
    const tilemap = buildAct4OverworldTilemap();
    const stripped = { ...tilemap, objects: tilemap.objects.filter((object) => object.id !== HYDRA_AMBUSH_TRIGGER_ID) };
    expect(buildAct4HydraAmbushCutscene(stripped, { isCompactViewport: false })).toEqual([]);
  });
});
