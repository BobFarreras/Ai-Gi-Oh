// src/services/story/overworld/act-2-overworld-tilemap.test.ts - Blinda el Acto 2: válido, reutiliza contenido real y con gating físico correcto.
import { buildAct2OverworldTilemap } from "@/services/story/overworld/act-2-overworld-tilemap";
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

function contextFor(completed: string[]) {
  const tilemap = buildAct2OverworldTilemap();
  return {
    tilemap,
    context: resolveMovementContext({
      collisionGrid: buildCollisionGridFromTilemap(tilemap),
      gates: listGatesFromTilemap(tilemap),
      progress: buildProgress(completed),
    }),
  };
}

describe("buildAct2OverworldTilemap", () => {
  it("se construye y valida sin lanzar", () => {
    expect(() => buildAct2OverworldTilemap()).not.toThrow();
  });

  it("reutiliza los ids reales del capítulo 2 y marca a Helena (duel-7) como jefe", () => {
    const objects = buildAct2OverworldTilemap().objects;
    const ids = new Set(objects.map((object) => object.id));
    for (let n = 1; n <= 8; n++) expect(ids.has(`story-ch2-duel-${n}`)).toBe(true);
    const boss = objects.find((object) => object.kind === "BOSS")!;
    expect(boss.id).toBe("story-ch2-duel-7");
  });

  it("la sala del jefe está sellada por la compuerta que exige vencer a BigLog (duel-8)", () => {
    const spawn = buildAct2OverworldTilemap().spawns[0];
    const boss = buildAct2OverworldTilemap().objects.find((object) => object.kind === "BOSS")!;
    const bossAnchor = { tileX: boss.tileX, tileY: boss.tileY + 1 };
    const start = { tileX: spawn.tileX, tileY: spawn.tileY };

    const locked = contextFor([]);
    expect(findGridPath(start, bossAnchor, locked.context)).toBeNull();

    const open = contextFor(["story-ch2-duel-8"]);
    expect(findGridPath(start, bossAnchor, open.context)).not.toBeNull();
  });

  it("el portal al Acto 3 exige vencer al jefe (duel-7)", () => {
    const { tilemap } = contextFor([]);
    const spawn = tilemap.spawns[0];
    const warp = tilemap.objects.find((object) => object.id === "story-ch2-transition-to-act3")!;
    const warpTile = { tileX: warp.tileX, tileY: warp.tileY };
    const start = { tileX: spawn.tileX, tileY: spawn.tileY };

    // Con BigLog vencido pero sin el jefe: el portal sigue bloqueado.
    expect(findGridPath(start, warpTile, contextFor(["story-ch2-duel-8"]).context)).toBeNull();
    // Venciendo BigLog y el jefe: el portal es alcanzable.
    expect(findGridPath(start, warpTile, contextFor(["story-ch2-duel-8", "story-ch2-duel-7"]).context)).not.toBeNull();
  });

  it("las recompensas se cogen al chocar (BUMP) y hay nodos de servicio", () => {
    const objects = buildAct2OverworldTilemap().objects;
    const rewards = objects.filter((object) => object.kind === "REWARD_NEXUS" || object.kind === "REWARD_CARD");
    expect(rewards.length).toBeGreaterThan(0);
    expect(rewards.every((object) => object.trigger === "BUMP")).toBe(true);
    const kinds = new Set(objects.map((object) => object.kind));
    expect(kinds.has("MARKET")).toBe(true);
    expect(kinds.has("ARSENAL")).toBe(true);
    expect(kinds.has("TELEPORT")).toBe(true);
  });

  it("los nodos de recompensa existen en el registro (para el claim server-side)", () => {
    const rewardIds = buildAct2OverworldTilemap()
      .objects.filter((object) => object.kind === "REWARD_NEXUS" || object.kind === "REWARD_CARD")
      .map((object) => object.id);
    for (const nodeId of rewardIds) {
      const definition = findStoryVirtualNodeDefinition(nodeId);
      expect(definition).not.toBeNull();
      expect(["REWARD_NEXUS", "REWARD_CARD"]).toContain(definition?.nodeType);
    }
  });
});
