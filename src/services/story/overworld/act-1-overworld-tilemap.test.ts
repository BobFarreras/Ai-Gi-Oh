// src/services/story/overworld/act-1-overworld-tilemap.test.ts - Blinda el circuito del Acto 1: válido, gateado y con nodos reales.
import { buildAct1OverworldTilemap } from "@/services/story/overworld/act-1-overworld-tilemap";
import {
  buildCollisionGridFromTilemap,
  listGatesFromTilemap,
} from "@/services/story/overworld/tilemap-runtime";
import { resolveMovementContext } from "@/core/services/story/overworld/movement-rules";
import { findGridPath } from "@/core/services/story/overworld/pathfinding";
import { IOverworldProgressState } from "@/core/services/story/overworld/overworld-types";
import { findStoryVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-registry";

function buildProgress(completed: string[]): IOverworldProgressState {
  return {
    visitedNodeIds: new Set<string>(),
    interactedNodeIds: new Set<string>(),
    completedNodeIds: new Set<string>(completed),
  };
}

describe("buildAct1OverworldTilemap", () => {
  it("se construye y valida sin lanzar", () => {
    expect(() => buildAct1OverworldTilemap()).not.toThrow();
  });

  it("reutiliza los ids de nodo reales del Acto 1", () => {
    const ids = new Set(buildAct1OverworldTilemap().objects.map((object) => object.id));
    expect(ids.has("story-ch1-duel-1")).toBe(true);
    expect(ids.has("story-ch1-duel-5")).toBe(true);
    expect(ids.has("story-a1-event-biglog-briefing")).toBe(true);
    expect(ids.has("story-ch1-transition-to-act2")).toBe(true);
  });

  it("usa imágenes reales existentes en los objetos", () => {
    const duel = buildAct1OverworldTilemap().objects.find((object) => object.id === "story-ch1-duel-1");
    expect(duel?.imageSrc).toContain("avatar-Soldado-act01.webp");
    expect(duel?.duelHref).toBe("/hub/story/chapter/1/duel/1");
  });

  it("mundo abierto: la sala de jefes es accesible sin requisitos previos", () => {
    const tilemap = buildAct1OverworldTilemap();
    const context = resolveMovementContext({
      collisionGrid: buildCollisionGridFromTilemap(tilemap),
      gates: listGatesFromTilemap(tilemap),
      progress: buildProgress([]),
    });
    const spawn = tilemap.spawns[0];
    const boss = tilemap.objects.find((object) => object.kind === "BOSS")!;
    // Sin haber vencido a nadie, se puede llegar hasta la casilla contigua al jefe.
    const bossAnchor = { tileX: boss.tileX, tileY: boss.tileY + 1 };
    expect(findGridPath({ tileX: spawn.tileX, tileY: spawn.tileY }, bossAnchor, context)).not.toBeNull();
  });

  it("los rivales definen rango de visión y orientación", () => {
    const duel = buildAct1OverworldTilemap().objects.find((object) => object.id === "story-ch1-duel-1")!;
    expect(duel.visionRange).toBeGreaterThan(0);
    expect(duel.facing).toBe("DOWN");
  });

  it("el rival 4 patrulla con recorrido largo y barre su visión (móvil, esquivable)", () => {
    const duel4 = buildAct1OverworldTilemap().objects.find((object) => object.id === "story-ch1-duel-4")!;
    expect(duel4.patrolAxis).toBe("H");
    expect(duel4.patrolLength).toBeGreaterThan(0);
    expect(duel4.patrolSweep).toBe(true);
  });

  it("el rival 3 guarda estático la entrada de la sala de jefes (vigila el corredor)", () => {
    const duel3 = buildAct1OverworldTilemap().objects.find((object) => object.id === "story-ch1-duel-3")!;
    expect(duel3.tileX).toBe(27);
    expect(duel3.facing).toBe("DOWN");
    expect(duel3.patrolAxis).toBeUndefined();
  });

  it("mundo abierto: los duelos no encadenan requisitos (orden agnóstico)", () => {
    const byId = new Map(buildAct1OverworldTilemap().objects.map((object) => [object.id, object]));
    for (const id of ["story-ch1-duel-1", "story-ch1-duel-2", "story-ch1-duel-3", "story-ch1-duel-4", "story-ch1-duel-5"]) {
      expect(byId.get(id)?.gateRequiredNodeIds ?? []).toEqual([]);
    }
    // La única puerta con requisito es la del portal del Acto 2: el jefe sigue siendo obligatorio para avanzar.
    expect(byId.get("story-a1-gate-boss")?.gateRequiredNodeIds).toEqual(["story-ch1-duel-5"]);
  });

  it("las recompensas se recogen pulsando el botón al lado (ADJACENT_ACTION) y hay un nodo de mercado", () => {
    const objects = buildAct1OverworldTilemap().objects;
    const rewards = objects.filter((object) => object.kind === "REWARD_NEXUS" || object.kind === "REWARD_CARD");
    expect(rewards.length).toBeGreaterThan(0);
    expect(rewards.every((object) => object.trigger === "ADJACENT_ACTION")).toBe(true);
    const kinds = new Set(objects.map((object) => object.kind));
    expect(kinds.has("MARKET")).toBe(true);
    expect(kinds.has("ARSENAL")).toBe(true);
    expect(kinds.has("TELEPORT")).toBe(true);
    // El teletransporte es un nodo de acción contiguo al spawn (no se activa al pisar).
    const teleport = objects.find((object) => object.kind === "TELEPORT")!;
    const spawn = buildAct1OverworldTilemap().spawns[0];
    expect(teleport.trigger).toBe("ADJACENT_ACTION");
    const distanceToSpawn = Math.abs(teleport.tileX - spawn.tileX) + Math.abs(teleport.tileY - spawn.tileY);
    expect(distanceToSpawn).toBe(1);
  });

  it("los nodos de recompensa existen en el registro con su tipo (para el claim server-side)", () => {
    const rewardIds = buildAct1OverworldTilemap()
      .objects.filter((object) => object.kind === "REWARD_NEXUS" || object.kind === "REWARD_CARD")
      .map((object) => object.id);
    expect(rewardIds.length).toBeGreaterThan(0);
    for (const nodeId of rewardIds) {
      const definition = findStoryVirtualNodeDefinition(nodeId);
      expect(definition).not.toBeNull();
      expect(["REWARD_NEXUS", "REWARD_CARD"]).toContain(definition?.nodeType);
    }
  });

  it("hace el jefe obligatorio: el portal del Acto 2 exige vencer al boss", () => {
    const tilemap = buildAct1OverworldTilemap();
    const collisionGrid = buildCollisionGridFromTilemap(tilemap);
    const gates = listGatesFromTilemap(tilemap);
    const spawn = tilemap.spawns[0];
    const warp = tilemap.objects.find((object) => object.kind === "WARP")!;
    const warpTile = { tileX: warp.tileX, tileY: warp.tileY };

    // Con todo menos el jefe: el portal sigue bloqueado.
    const withoutBoss = resolveMovementContext({
      collisionGrid,
      gates,
      progress: buildProgress(["story-ch1-duel-1", "story-ch1-duel-2", "story-ch1-duel-3", "story-ch1-duel-4"]),
    });
    expect(findGridPath({ tileX: spawn.tileX, tileY: spawn.tileY }, warpTile, withoutBoss)).toBeNull();

    // Venciendo también al jefe: el portal es alcanzable.
    const withBoss = resolveMovementContext({
      collisionGrid,
      gates,
      progress: buildProgress(["story-ch1-duel-1", "story-ch1-duel-5"]),
    });
    expect(findGridPath({ tileX: spawn.tileX, tileY: spawn.tileY }, warpTile, withBoss)).not.toBeNull();
  });

  it("permite alcanzar la rama lateral (duelo 2) sin la puerta", () => {
    const tilemap = buildAct1OverworldTilemap();
    const context = resolveMovementContext({
      collisionGrid: buildCollisionGridFromTilemap(tilemap),
      gates: listGatesFromTilemap(tilemap),
      progress: buildProgress([]),
    });
    const spawn = tilemap.spawns[0];
    const sideDuel = tilemap.objects.find((object) => object.id === "story-ch1-duel-2")!;
    const anchor = { tileX: sideDuel.tileX, tileY: sideDuel.tileY + 1 };
    expect(findGridPath({ tileX: spawn.tileX, tileY: spawn.tileY }, anchor, context)).not.toBeNull();
  });
});
