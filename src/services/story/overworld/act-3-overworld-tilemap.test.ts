// src/services/story/overworld/act-3-overworld-tilemap.test.ts - Blinda el Acto 3: válido, mecánicas nuevas y gating (cortafuegos + BigLog -> jefe, puzzle de placa, portal al Acto 4).
import { buildAct3OverworldTilemap } from "@/services/story/overworld/act-3-overworld-tilemap";
import {
  buildCollisionGridFromTilemap,
  listGatesFromTilemap,
} from "@/services/story/overworld/tilemap-runtime";
import { resolveMovementContext } from "@/core/services/story/overworld/movement-rules";
import { findGridPath } from "@/core/services/story/overworld/pathfinding";
import { IOverworldProgressState, toGridPositionKey } from "@/core/services/story/overworld/overworld-types";
import { findStoryVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-registry";

const TERMINAL = "story-ch3-firewall-terminal";
const PLATE = "story-ch3-plate-1";

function contextFor(progress: { completed?: string[]; interacted?: string[] }) {
  const tilemap = buildAct3OverworldTilemap();
  const completed = new Set<string>(progress.completed ?? []);
  const state: IOverworldProgressState = {
    visitedNodeIds: new Set<string>(),
    interactedNodeIds: new Set<string>(progress.interacted ?? []),
    completedNodeIds: completed,
  };
  // Rivales derrotados liberan su casilla (se teletransportan), como en el engine.
  const openTileKeys = new Set<string>(
    tilemap.objects
      .filter((object) => (object.kind === "DUEL" || object.kind === "BOSS") && completed.has(object.id))
      .map((object) => toGridPositionKey({ tileX: object.tileX, tileY: object.tileY })),
  );
  return {
    tilemap,
    context: resolveMovementContext({
      collisionGrid: buildCollisionGridFromTilemap(tilemap),
      gates: listGatesFromTilemap(tilemap),
      progress: state,
      openTileKeys,
    }),
  };
}

function spawnTile(tilemap: ReturnType<typeof buildAct3OverworldTilemap>) {
  const spawn = tilemap.spawns[0];
  return { tileX: spawn.tileX, tileY: spawn.tileY };
}

function objectTile(id: string) {
  const object = buildAct3OverworldTilemap().objects.find((entry) => entry.id === id)!;
  return { tileX: object.tileX, tileY: object.tileY };
}

describe("buildAct3OverworldTilemap", () => {
  it("se construye y valida sin lanzar, en modo oscuro", () => {
    const tilemap = buildAct3OverworldTilemap();
    expect(tilemap.ambient).toBe("DARK");
    expect(tilemap.act).toBe(3);
  });

  it("reutiliza los ids reales del capítulo 3 y marca a Jaku (duel-6) como jefe", () => {
    const objects = buildAct3OverworldTilemap().objects;
    const ids = new Set(objects.map((object) => object.id));
    for (let n = 1; n <= 6; n++) expect(ids.has(`story-ch3-duel-${n}`)).toBe(true);
    expect(objects.find((object) => object.kind === "BOSS")!.id).toBe("story-ch3-duel-6");
  });

  it("estrena las 4 mecánicas: interruptores, caja, placa, terminal y una cinta", () => {
    const tilemap = buildAct3OverworldTilemap();
    const kinds = tilemap.objects.map((object) => object.kind);
    expect(kinds.filter((kind) => kind === "SWITCH").length).toBeGreaterThanOrEqual(2);
    expect(kinds).toContain("BOX");
    expect(kinds).toContain("PLATE");
    expect(kinds).toContain("SUBMISSION");
    // Al menos una casilla de cinta en la capa ground.
    const hasBelt = tilemap.layers.ground.some((row) => row.some((cell) => cell >= 6 && cell <= 9));
    expect(hasBelt).toBe(true);
  });

  it("el Fork de entrada (duel-1) bloquea físicamente el acceso al hub", () => {
    const hub = { tileX: 16, tileY: 28 };
    const blocked = contextFor({});
    expect(findGridPath(spawnTile(blocked.tilemap), hub, blocked.context)).toBeNull();
    const cleared = contextFor({ completed: ["story-ch3-duel-1"] });
    expect(findGridPath(spawnTile(cleared.tilemap), hub, cleared.context)).not.toBeNull();
  });

  it("la caché de la rama izquierda exige resolver el puzzle de la placa", () => {
    const cacheTile = objectTile("story-ch3-cache-1");
    // Fork vencido pero placa sin pulsar: la compuerta sigue cerrada.
    const noPlate = contextFor({ completed: ["story-ch3-duel-1"] });
    expect(findGridPath(spawnTile(noPlate.tilemap), cacheTile, noPlate.context)).toBeNull();
    // Placa pulsada (caja encima, simulada como interacted): la caché es alcanzable.
    const platePressed = contextFor({ completed: ["story-ch3-duel-1"], interacted: [PLATE] });
    expect(findGridPath(spawnTile(platePressed.tilemap), cacheTile, platePressed.context)).not.toBeNull();
  });

  it("el jefe (Jaku) exige hackear el cortafuegos (terminal) y superar a BigLog (duel-5)", () => {
    const bossAnchor = { tileX: 20, tileY: 7 };
    // Solo con el Fork de entrada vencido: la compuerta del cortafuegos sigue cerrada.
    const noHack = contextFor({ completed: ["story-ch3-duel-1"] });
    expect(findGridPath(spawnTile(noHack.tilemap), bossAnchor, noHack.context)).toBeNull();
    // Terminal hackeado + BigLog vencido: el jefe es alcanzable.
    const hacked = contextFor({
      completed: ["story-ch3-duel-1", "story-ch3-duel-5"],
      interacted: [TERMINAL],
    });
    expect(findGridPath(spawnTile(hacked.tilemap), bossAnchor, hacked.context)).not.toBeNull();
  });

  it("el portal al Acto 4 exige vencer al jefe (duel-6)", () => {
    const warpTile = objectTile("story-ch3-transition-to-act4");
    const base = { completed: ["story-ch3-duel-1", "story-ch3-duel-5"], interacted: [TERMINAL] };
    const withoutBoss = contextFor(base);
    expect(findGridPath(spawnTile(withoutBoss.tilemap), warpTile, withoutBoss.context)).toBeNull();
    const withBoss = contextFor({ ...base, completed: [...base.completed, "story-ch3-duel-6"] });
    expect(findGridPath(spawnTile(withBoss.tilemap), warpTile, withBoss.context)).not.toBeNull();
  });

  it("hay servicios y las recompensas se recogen pulsando al lado (ADJACENT_ACTION)", () => {
    const objects = buildAct3OverworldTilemap().objects;
    const kinds = new Set(objects.map((object) => object.kind));
    expect(kinds.has("MARKET")).toBe(true);
    expect(kinds.has("ARSENAL")).toBe(true);
    expect(kinds.has("TELEPORT")).toBe(true);
    const rewards = objects.filter((object) => object.kind === "REWARD_NEXUS" || object.kind === "REWARD_CARD");
    expect(rewards.length).toBeGreaterThan(0);
    expect(rewards.every((object) => object.trigger === "ADJACENT_ACTION")).toBe(true);
  });

  it("los nodos de recompensa y eventos existen en el registro (claim/mark server-side)", () => {
    for (const nodeId of [
      "story-ch3-cache-1",
      "story-ch3-cache-2",
      "story-ch3-cache-card",
      "story-ch3-event-intro",
      "story-ch3-event-corrupt-log",
      "story-ch3-switch-entrance",
      "story-ch3-switch-deep",
      "story-ch3-firewall-terminal",
    ]) {
      expect(findStoryVirtualNodeDefinition(nodeId)).not.toBeNull();
    }
  });
});
