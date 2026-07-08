// src/components/hub/story/overworld/engine/camera-math.test.ts - Verifica follow, clamp y culling de la cámara del overworld.
import {
  resolveCameraOffset,
  resolveVisibleTileRange,
} from "@/components/hub/story/overworld/engine/camera-math";

const viewport = { width: 800, height: 600 };
const world = { width: 3200, height: 2400 };

describe("resolveCameraOffset", () => {
  it("centra el foco cuando hay margen en ambos ejes", () => {
    const offset = resolveCameraOffset({ x: 1600, y: 1200 }, viewport, world);
    expect(offset).toEqual({ x: 800 / 2 - 1600, y: 600 / 2 - 1200 });
  });

  it("no enseña vacío en el borde superior-izquierdo", () => {
    const offset = resolveCameraOffset({ x: 10, y: 10 }, viewport, world);
    expect(offset).toEqual({ x: 0, y: 0 });
  });

  it("no enseña vacío en el borde inferior-derecho", () => {
    const offset = resolveCameraOffset({ x: 3190, y: 2390 }, viewport, world);
    expect(offset).toEqual({ x: viewport.width - world.width, y: viewport.height - world.height });
  });

  it("centra el mundo cuando es más pequeño que el viewport", () => {
    const smallWorld = { width: 400, height: 200 };
    const offset = resolveCameraOffset({ x: 200, y: 100 }, viewport, smallWorld);
    expect(offset).toEqual({ x: 200, y: 200 });
  });
});

describe("resolveVisibleTileRange", () => {
  it("recorta el rango visible al tamaño del mapa", () => {
    const range = resolveVisibleTileRange({
      cameraOffset: { x: 0, y: 0 },
      viewport,
      tileSize: 32,
      mapWidth: 100,
      mapHeight: 75,
    });
    expect(range.minTileX).toBe(0);
    expect(range.minTileY).toBe(0);
    expect(range.maxTileX).toBe(26); // ceil(800/32)+1
    expect(range.maxTileY).toBe(20); // ceil(600/32)+1
  });

  it("desplaza el rango con la cámara sin salirse de límites", () => {
    const range = resolveVisibleTileRange({
      cameraOffset: { x: -3000, y: -2200 },
      viewport,
      tileSize: 32,
      mapWidth: 100,
      mapHeight: 75,
    });
    expect(range.minTileX).toBe(92); // floor(3000/32)-1
    expect(range.maxTileX).toBe(99);
    expect(range.maxTileY).toBe(74);
  });
});
