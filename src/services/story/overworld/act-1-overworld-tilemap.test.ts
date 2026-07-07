// src/services/story/overworld/act-1-overworld-tilemap.test.ts - Blinda el circuito del Acto 1: válido, gateado y con nodos reales.
import { buildAct1OverworldTilemap } from "@/services/story/overworld/act-1-overworld-tilemap";
import {
  buildCollisionGridFromTilemap,
  listGatesFromTilemap,
} from "@/services/story/overworld/tilemap-runtime";
import { resolveMovementContext } from "@/core/services/story/overworld/movement-rules";
import { findGridPath } from "@/core/services/story/overworld/pathfinding";
import { IOverworldProgressState } from "@/core/services/story/overworld/overworld-types";

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

  it("bloquea el tramo de jefes hasta ganar el duelo 1 y lo abre después", () => {
    const tilemap = buildAct1OverworldTilemap();
    const collisionGrid = buildCollisionGridFromTilemap(tilemap);
    const gates = listGatesFromTilemap(tilemap);
    const spawn = tilemap.spawns[0];
    const boss = tilemap.objects.find((object) => object.kind === "BOSS")!;
    // La aproximación al jefe (celda de suelo bajo su casilla) es lo navegable.
    const bossAnchor = { tileX: boss.tileX, tileY: boss.tileY + 1 };

    const closed = resolveMovementContext({ collisionGrid, gates, progress: buildProgress([]) });
    expect(findGridPath({ tileX: spawn.tileX, tileY: spawn.tileY }, bossAnchor, closed)).toBeNull();

    const open = resolveMovementContext({ collisionGrid, gates, progress: buildProgress(["story-ch1-duel-1"]) });
    const path = findGridPath({ tileX: spawn.tileX, tileY: spawn.tileY }, bossAnchor, open);
    expect(path).not.toBeNull();
    // La ruta abierta cruza obligatoriamente la puerta (choke real).
    expect(path?.some((cell) => cell.tileX === 25 && cell.tileY === 13)).toBe(true);
  });

  it("los rivales definen rango de visión y orientación", () => {
    const duel = buildAct1OverworldTilemap().objects.find((object) => object.id === "story-ch1-duel-1")!;
    expect(duel.visionRange).toBeGreaterThan(0);
    expect(duel.facing).toBe("DOWN");
  });

  it("algunos rivales patrullan (entidades móviles)", () => {
    const duel3 = buildAct1OverworldTilemap().objects.find((object) => object.id === "story-ch1-duel-3")!;
    expect(duel3.patrolAxis).toBe("H");
    expect(duel3.patrolLength).toBeGreaterThan(0);
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
