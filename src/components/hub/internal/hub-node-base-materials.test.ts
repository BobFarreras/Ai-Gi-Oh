// src/components/hub/internal/hub-node-base-materials.test.ts - Verifica que los materiales base de nodos usan el color y opacidad esperados.
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createNodeBaseMaterials } from "./hub-node-base-materials";

describe("createNodeBaseMaterials", () => {
  it("crea materiales con el color recibido y opacidades fijas", () => {
    const materials = createNodeBaseMaterials("#10b981");
    expect((materials.circle.color as THREE.Color).getHexString()).toBe("10b981");
    expect(materials.circle.transparent).toBe(true);
    expect(materials.circle.opacity).toBe(0.03);
    expect(materials.outerRing.opacity).toBe(0.4);
    expect(materials.innerRing.opacity).toBe(0.15);
    expect(materials.innerRing.wireframe).toBe(true);
    expect(materials.spoke.opacity).toBe(0.6);
  });

  it("crea instancias distintas entre llamadas", () => {
    const a = createNodeBaseMaterials("#10b981");
    const b = createNodeBaseMaterials("#10b981");
    expect(a.circle).not.toBe(b.circle);
  });
});
