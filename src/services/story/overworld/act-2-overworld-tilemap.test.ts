// src/services/story/overworld/act-2-overworld-tilemap.test.ts - Blinda el Acto 2: válido, reutiliza contenido real y con el gating narrativo (vídeo→puertas, 2 llaves→puente, jefe→portal).
import { buildAct2OverworldTilemap } from "@/services/story/overworld/act-2-overworld-tilemap";
import {
  buildCollisionGridFromTilemap,
  listGatesFromTilemap,
} from "@/services/story/overworld/tilemap-runtime";
import { resolveMovementContext } from "@/core/services/story/overworld/movement-rules";
import { findGridPath } from "@/core/services/story/overworld/pathfinding";
import { IOverworldProgressState, toGridPositionKey } from "@/core/services/story/overworld/overworld-types";
import { findStoryVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-registry";

const EVENT_BRIDGE = "story-ch2-event-core";
const KEY_LEFT = "story-ch2-branch-center-a";
const KEY_RIGHT = "story-ch2-branch-bottom-c";

function contextFor(progress: { completed?: string[]; interacted?: string[] }) {
  const tilemap = buildAct2OverworldTilemap();
  const completed = new Set<string>(progress.completed ?? []);
  const state: IOverworldProgressState = {
    visitedNodeIds: new Set<string>(),
    interactedNodeIds: new Set<string>(progress.interacted ?? []),
    completedNodeIds: completed,
  };
  // Los rivales derrotados liberan su casilla (se teletransportan), igual que en el engine.
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

function spawnTile(tilemap: ReturnType<typeof buildAct2OverworldTilemap>) {
  const spawn = tilemap.spawns[0];
  return { tileX: spawn.tileX, tileY: spawn.tileY };
}

describe("buildAct2OverworldTilemap", () => {
  it("se construye y valida sin lanzar", () => {
    expect(() => buildAct2OverworldTilemap()).not.toThrow();
  });

  it("reutiliza los ids reales del capítulo 2 y marca a Helena (duel-7) como jefe", () => {
    const objects = buildAct2OverworldTilemap().objects;
    const ids = new Set(objects.map((object) => object.id));
    for (let n = 1; n <= 8; n++) expect(ids.has(`story-ch2-duel-${n}`)).toBe(true);
    expect(objects.find((object) => object.kind === "BOSS")!.id).toBe("story-ch2-duel-7");
  });

  it("las llaves usan las imágenes reales de llave", () => {
    const objects = buildAct2OverworldTilemap().objects;
    expect(objects.find((object) => object.id === KEY_LEFT)?.imageSrc).toContain("llave-1");
    expect(objects.find((object) => object.id === KEY_RIGHT)?.imageSrc).toContain("llave-2");
  });

  it("la llave está tras la puerta (vídeo) Y detrás de Helena (hay que vencerla)", () => {
    const key = buildAct2OverworldTilemap().objects.find((object) => object.id === KEY_LEFT)!;
    const keyTile = { tileX: key.tileX, tileY: key.tileY };

    // Sin ver el vídeo: la rama de la llave está cerrada.
    expect(findGridPath(spawnTile(contextFor({}).tilemap), keyTile, contextFor({}).context)).toBeNull();

    // Vídeo visto (puerta abierta) pero Helena viva: la llave sigue bloqueada por Helena.
    const doorOpen = contextFor({ interacted: [EVENT_BRIDGE] });
    expect(findGridPath(spawnTile(doorOpen.tilemap), keyTile, doorOpen.context)).toBeNull();

    // Vídeo + Helena (duel-1) vencida (se teletransporta): la llave es alcanzable.
    const helenaDown = contextFor({ interacted: [EVENT_BRIDGE], completed: ["story-ch2-duel-1"] });
    expect(findGridPath(spawnTile(helenaDown.tilemap), keyTile, helenaDown.context)).not.toBeNull();
  });

  it("el puente al jefe solo se despliega con las DOS mitades de la llave", () => {
    const boss = buildAct2OverworldTilemap().objects.find((object) => object.kind === "BOSS")!;
    const bossAnchor = { tileX: boss.tileX, tileY: boss.tileY + 1 };

    const oneKey = contextFor({ interacted: [EVENT_BRIDGE, KEY_LEFT] });
    expect(findGridPath(spawnTile(oneKey.tilemap), bossAnchor, oneKey.context)).toBeNull();

    const bothKeys = contextFor({ interacted: [EVENT_BRIDGE, KEY_LEFT, KEY_RIGHT] });
    expect(findGridPath(spawnTile(bothKeys.tilemap), bossAnchor, bothKeys.context)).not.toBeNull();
  });

  it("el portal al Acto 3 exige vencer al jefe (duel-7)", () => {
    const warp = buildAct2OverworldTilemap().objects.find((object) => object.id === "story-ch2-transition-to-act3")!;
    const warpTile = { tileX: warp.tileX, tileY: warp.tileY };

    const withoutBoss = contextFor({ interacted: [EVENT_BRIDGE, KEY_LEFT, KEY_RIGHT] });
    expect(findGridPath(spawnTile(withoutBoss.tilemap), warpTile, withoutBoss.context)).toBeNull();

    const withBoss = contextFor({ interacted: [EVENT_BRIDGE, KEY_LEFT, KEY_RIGHT], completed: ["story-ch2-duel-7"] });
    expect(findGridPath(spawnTile(withBoss.tilemap), warpTile, withBoss.context)).not.toBeNull();
  });

  it("las recompensas se recogen pulsando el botón al lado (ADJACENT_ACTION) y hay nodos de servicio", () => {
    const objects = buildAct2OverworldTilemap().objects;
    const rewards = objects.filter((object) => object.kind === "REWARD_NEXUS" || object.kind === "REWARD_CARD");
    expect(rewards.length).toBeGreaterThan(0);
    expect(rewards.every((object) => object.trigger === "ADJACENT_ACTION")).toBe(true);
    const kinds = new Set(objects.map((object) => object.kind));
    expect(kinds.has("MARKET")).toBe(true);
    expect(kinds.has("ARSENAL")).toBe(true);
    expect(kinds.has("TELEPORT")).toBe(true);
  });

  it("las llaves existen en el registro de nodos virtuales (para el claim server-side)", () => {
    for (const nodeId of [KEY_LEFT, KEY_RIGHT]) {
      expect(findStoryVirtualNodeDefinition(nodeId)).not.toBeNull();
    }
  });
});
